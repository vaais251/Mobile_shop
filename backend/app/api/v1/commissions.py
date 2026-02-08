"""
Commission management API endpoints.
For tracking and processing platform commissions on community sales.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.models.commission import Commission, CommissionStatus
from app.models.order import Order, OrderItem
from app.models.team_member import TeamMember
from app.models.audit_log import AuditLog
from app.schemas.commission import (
    CommissionResponse,
    CommissionListResponse,
    CommissionPaymentProcess,
    CommissionBulkPayout,
    CommissionUpdate,
    CommissionSummaryBySeller,
    CommissionReportResponse
)

router = APIRouter(prefix="/admin/commissions", tags=["commissions"])


def check_commission_permission(current_user: User, db: Session, require_process: bool = False):
    """Check if user has permission to manage commissions."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access commission management"
        )
    
    if require_process:
        team_member = db.query(TeamMember).filter(
            TeamMember.user_id == current_user.id,
            TeamMember.is_active == True
        ).first()
        
        if team_member and not (team_member.is_super_admin or team_member.can_process_commissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to process commission payments"
            )


@router.get("", response_model=CommissionListResponse)
async def get_commissions(
    status_filter: Optional[str] = Query(None, description="Filter by status: pending, paid, etc."),
    seller_id: Optional[int] = Query(None, description="Filter by seller ID"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Get list of commissions with filters.
    
    Query params:
    - status_filter: pending, paid, disputed, etc.
    - seller_id: Filter by specific seller
    - start_date/end_date: Date range filter
    """
    check_commission_permission(current_user, db)
    
    query = db.query(Commission).options(joinedload(Commission.seller))
    
    # Apply filters
    if status_filter:
        query = query.filter(Commission.status == status_filter)
    
    if seller_id:
        query = query.filter(Commission.seller_id == seller_id)
    
    if start_date:
        query = query.filter(Commission.created_at >= start_date)
    
    if end_date:
        query = query.filter(Commission.created_at <= end_date)
    
    # Get totals
    total = query.count()
    pending_count = db.query(func.count(Commission.id)).filter(
        Commission.status == CommissionStatus.PENDING
    ).scalar() or 0
    paid_count = db.query(func.count(Commission.id)).filter(
        Commission.status == CommissionStatus.PAID
    ).scalar() or 0
    
    total_pending_amount = db.query(func.sum(Commission.commission_amount)).filter(
        Commission.status == CommissionStatus.PENDING
    ).scalar() or Decimal("0.00")
    
    total_paid_amount = db.query(func.sum(Commission.commission_amount)).filter(
        Commission.status == CommissionStatus.PAID
    ).scalar() or Decimal("0.00")
    
    # Get paginated results
    commissions = query.order_by(Commission.created_at.desc()).offset(skip).limit(limit).all()
    
    return CommissionListResponse(
        total=total,
        pending_count=pending_count,
        paid_count=paid_count,
        total_pending_amount=total_pending_amount,
        total_paid_amount=total_paid_amount,
        commissions=commissions
    )


@router.get("/{commission_id}", response_model=CommissionResponse)
async def get_commission(
    commission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Get specific commission details."""
    check_commission_permission(current_user, db)
    
    commission = db.query(Commission).options(joinedload(Commission.seller)).filter(
        Commission.id == commission_id
    ).first()
    
    if not commission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commission not found"
        )
    
    return commission


@router.post("/{commission_id}/pay", response_model=CommissionResponse)
async def process_commission_payment(
    commission_id: int,
    payment_data: CommissionPaymentProcess,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Process commission payment to seller.
    
    Marks commission as paid and records payment details.
    """
    check_commission_permission(current_user, db, require_process=True)
    
    commission = db.query(Commission).filter(Commission.id == commission_id).first()
    if not commission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commission not found"
        )
    
    if not commission.is_payable:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Commission cannot be paid. Current status: {commission.status.value}"
        )
    
    # Mark as paid
    commission.mark_as_paid(
        payment_method=payment_data.payment_method,
        payment_reference=payment_data.payment_reference,
        processed_by_id=current_user.id
    )
    
    if payment_data.notes:
        commission.notes = payment_data.notes
    
    # Log action
    audit_log = AuditLog.log_action(
        user_id=current_user.id,
        action_type="commission_paid",
        resource_type="commission",
        resource_id=commission.id,
        new_value={
            "amount": float(commission.commission_amount),
            "seller_id": commission.seller_id,
            "payment_method": payment_data.payment_method,
            "payment_reference": payment_data.payment_reference
        },
        description=f"Processed commission payment: ${commission.commission_amount} to seller ID {commission.seller_id}"
    )
    db.add(audit_log)
    
    db.commit()
    db.refresh(commission)
    
    return commission


@router.post("/bulk-pay", status_code=status.HTTP_200_OK)
async def bulk_process_commissions(
    bulk_data: CommissionBulkPayout,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Process multiple commission payments at once.
    
    Useful for batch payouts to sellers.
    """
    check_commission_permission(current_user, db, require_process=True)
    
    if not bulk_data.commission_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No commission IDs provided"
        )
    
    commissions = db.query(Commission).filter(
        Commission.id.in_(bulk_data.commission_ids)
    ).all()
    
    if len(commissions) != len(bulk_data.commission_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Some commissions not found"
        )
    
    # Check all are payable
    non_payable = [c.id for c in commissions if not c.is_payable]
    if non_payable:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Commissions {non_payable} cannot be paid"
        )
    
    processed_count = 0
    total_amount = Decimal("0.00")
    
    for idx, commission in enumerate(commissions):
        payment_ref = f"{bulk_data.payment_reference_prefix}-{idx+1}"
        commission.mark_as_paid(
            payment_method=bulk_data.payment_method,
            payment_reference=payment_ref,
            processed_by_id=current_user.id
        )
        
        if bulk_data.notes:
            commission.notes = bulk_data.notes
        
        processed_count += 1
        total_amount += commission.commission_amount
    
    # Log bulk action
    audit_log = AuditLog.log_action(
        user_id=current_user.id,
        action_type="commission_paid",
        resource_type="commission",
        metadata={
            "bulk_operation": True,
            "commission_count": processed_count,
            "total_amount": float(total_amount),
            "commission_ids": bulk_data.commission_ids
        },
        description=f"Bulk processed {processed_count} commission payments totaling ${total_amount}"
    )
    db.add(audit_log)
    
    db.commit()
    
    return {
        "message": "Commissions processed successfully",
        "processed_count": processed_count,
        "total_amount": float(total_amount),
        "commission_ids": bulk_data.commission_ids
    }


@router.patch("/{commission_id}", response_model=CommissionResponse)
async def update_commission(
    commission_id: int,
    update_data: CommissionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update commission status or notes."""
    check_commission_permission(current_user, db, require_process=True)
    
    commission = db.query(Commission).filter(Commission.id == commission_id).first()
    if not commission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commission not found"
        )
    
    old_status = commission.status.value
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(commission, field, value)
    
    # Log status change
    if "status" in update_dict:
        audit_log = AuditLog.log_action(
            user_id=current_user.id,
            action_type="commission_disputed" if update_data.status == "disputed" else "order_status_changed",
            resource_type="commission",
            resource_id=commission.id,
            old_value={"status": old_status},
            new_value={"status": commission.status.value},
            description=f"Commission status changed from {old_status} to {commission.status.value}"
        )
        db.add(audit_log)
    
    db.commit()
    db.refresh(commission)
    
    return commission


@router.get("/reports/by-seller", response_model=CommissionReportResponse)
async def get_commission_report_by_seller(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Generate commission report grouped by seller.
    
    Shows totals, pending, and paid amounts for each seller.
    """
    check_commission_permission(current_user, db)
    
    # Default to last 30 days if no dates provided
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    # Query commissions in date range
    query = db.query(Commission).options(joinedload(Commission.seller)).filter(
        and_(
            Commission.created_at >= start_date,
            Commission.created_at <= end_date
        )
    )
    
    commissions = query.all()
    
    # Group by seller
    seller_data = {}
    total_platform_revenue = Decimal("0.00")
    total_seller_payouts = Decimal("0.00")
    
    for comm in commissions:
        if not comm.seller_id:
            continue
        
        if comm.seller_id not in seller_data:
            seller_data[comm.seller_id] = {
                "seller_id": comm.seller_id,
                "seller_name": comm.seller.name if comm.seller else "Unknown",
                "seller_email": comm.seller.email if comm.seller else "Unknown",
                "total_sales": Decimal("0.00"),
                "total_commissions": Decimal("0.00"),
                "pending_commissions": Decimal("0.00"),
                "paid_commissions": Decimal("0.00"),
                "commission_count": 0,
                "last_payment_date": None
            }
        
        seller_data[comm.seller_id]["total_sales"] += comm.product_price
        seller_data[comm.seller_id]["total_commissions"] += comm.commission_amount
        seller_data[comm.seller_id]["commission_count"] += 1
        
        if comm.status == CommissionStatus.PENDING:
            seller_data[comm.seller_id]["pending_commissions"] += comm.commission_amount
        elif comm.status == CommissionStatus.PAID:
            seller_data[comm.seller_id]["paid_commissions"] += comm.commission_amount
            if comm.paid_at:
                if not seller_data[comm.seller_id]["last_payment_date"] or comm.paid_at > seller_data[comm.seller_id]["last_payment_date"]:
                    seller_data[comm.seller_id]["last_payment_date"] = comm.paid_at
        
        total_platform_revenue += comm.platform_revenue
        total_seller_payouts += comm.seller_payout
    
    return CommissionReportResponse(
        start_date=start_date,
        end_date=end_date,
        total_platform_revenue=total_platform_revenue,
        total_seller_payouts=total_seller_payouts,
        total_transactions=len(commissions),
        seller_summaries=[CommissionSummaryBySeller(**data) for data in seller_data.values()]
    )
