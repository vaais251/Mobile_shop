"""Add extended order item snapshot fields

Revision ID: 001_add_order_item_snapshots
Revises: 
Create Date: 2026-02-08 22:03:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_add_order_item_snapshots'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add extended snapshot fields to order_items table
    op.add_column('order_items', sa.Column('phone_ram_gb', sa.Integer(), nullable=True, comment='Phone RAM in GB'))
    op.add_column('order_items', sa.Column('phone_camera_mp', sa.Integer(), nullable=True, comment='Main camera megapixels'))
    op.add_column('order_items', sa.Column('phone_battery_health', sa.Integer(), nullable=True, comment='Battery health percentage'))
    op.add_column('order_items', sa.Column('phone_battery_mah', sa.Integer(), nullable=True, comment='Battery capacity in mAh'))
    op.add_column('order_items', sa.Column('phone_condition_grade', sa.Float(), nullable=True, comment='Condition rating 1.0-10.0'))
    op.add_column('order_items', sa.Column('phone_defects', sa.Text(), nullable=True, comment='Description of defects'))
    op.add_column('order_items', sa.Column('phone_accessories', sa.Text(), nullable=True, comment='Included accessories'))
    op.add_column('order_items', sa.Column('phone_images', sa.Text(), nullable=True, comment='JSON array of image paths'))
    op.add_column('order_items', sa.Column('phone_thumbnail', sa.String(length=255), nullable=True, comment='Main product image'))
    op.add_column('order_items', sa.Column('phone_pta_approved', sa.Boolean(), default=False, comment='PTA approval status'))
    op.add_column('order_items', sa.Column('phone_warranty_months', sa.Integer(), default=0, comment='Warranty in months'))
    
    # Add seller snapshot fields
    op.add_column('order_items', sa.Column('seller_id', sa.Integer(), nullable=True, comment='Seller user ID (NULL = shop owned)'))
    op.add_column('order_items', sa.Column('seller_name', sa.String(length=100), nullable=True, comment='Seller name'))
    op.add_column('order_items', sa.Column('seller_email', sa.String(length=255), nullable=True, comment='Seller email'))
    op.add_column('order_items', sa.Column('seller_phone', sa.String(length=20), nullable=True, comment='Seller phone number'))
    op.add_column('order_items', sa.Column('seller_city', sa.String(length=100), nullable=True, comment='Seller city'))


def downgrade():
    # Remove all added columns
    op.drop_column('order_items', 'seller_city')
    op.drop_column('order_items', 'seller_phone')
    op.drop_column('order_items', 'seller_email')
    op.drop_column('order_items', 'seller_name')
    op.drop_column('order_items', 'seller_id')
    op.drop_column('order_items', 'phone_warranty_months')
    op.drop_column('order_items', 'phone_pta_approved')
    op.drop_column('order_items', 'phone_thumbnail')
    op.drop_column('order_items', 'phone_images')
    op.drop_column('order_items', 'phone_accessories')
    op.drop_column('order_items', 'phone_defects')
    op.drop_column('order_items', 'phone_condition_grade')
    op.drop_column('order_items', 'phone_battery_mah')
    op.drop_column('order_items', 'phone_battery_health')
    op.drop_column('order_items', 'phone_camera_mp')
    op.drop_column('order_items', 'phone_ram_gb')
