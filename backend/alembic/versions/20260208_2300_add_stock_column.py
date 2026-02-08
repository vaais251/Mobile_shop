"""Add stock column to phone_inventory

Revision ID: add_stock_column
Revises: 001_add_order_item_snapshots
Create Date: 2026-02-08 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_stock_column'
down_revision = '001_add_order_item_snapshots'
branch_labels = None
depends_on = None


def upgrade():
    # Add stock column with default value of 1
    op.add_column('phone_inventory', 
        sa.Column('stock', sa.Integer(), nullable=False, server_default='1', comment='Number of units available in stock')
    )
    
    # For existing products that are marked as sold, set stock to 0
    op.execute("""
        UPDATE phone_inventory 
        SET stock = 0 
        WHERE is_sold = TRUE
    """)


def downgrade():
    # Remove stock column
    op.drop_column('phone_inventory', 'stock')
