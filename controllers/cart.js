const CartModel = require('../models/cart');
const CouponModel = require('../models/coupon');
const createError = require('../utils/error');


class CartController{
    
    getCart = async(req, res, next)=>{
        try{
            const { _id } = req.userData;
            let cart = await CartModel.findById({ _id: _id }).populate('products.product', 'name images stock regularPrice salePrice isOnSale');

            res.status(200).json({
                cart: cart ? cart : { products: [], couponCode: '', couponDiscountPercentage: 0, couponMinimumAmount: 0 }
            });

        }catch(err){
            next(err);
        }
    }


    updateCart = async (req, res, next)=>{
        try{
            const { _id } = req.userData;
            const { updatedProducts, orderTotalAmount } = req.body;
            if(!req.body) return next(createError(400, 'Oops! some problem occurred'));

            let isVoucherRemoved = false;
            let minimumAmountForVoucher = null;
            // if array is not empty means user has updated its cart else if array is empty means the user has removed all items from his cart
            if(updatedProducts.length){   

                const dataToUpdate = { _id: _id, products: updatedProducts };

                const cart = await CartModel.findById({ _id }).select('couponMinimumAmount -_id');
                if(Number(orderTotalAmount)<cart.couponMinimumAmount){
                    isVoucherRemoved = true;
                    minimumAmountForVoucher = cart.couponMinimumAmount;
                    dataToUpdate.couponCode = '';
                    dataToUpdate.couponDiscountPercentage = 0;
                    dataToUpdate.couponMinimumAmount = 0;
                }

                await CartModel.updateOne({ _id: _id }, { $set: dataToUpdate }, { upsert: true });
            }
            else{                    
                await CartModel.deleteOne({ _id: _id });
            }

            res.status(200).json({
                message: 'Cart has been updated successfully',
                isVoucherRemoved,
                minimumAmountForVoucher
            });

        }catch(err){
            next(err);
        }
    }


    applyCouponCode = async(req, res, next)=>{
        try{
            const { _id } = req.userData;
            const { voucherCode, purchaseAmount } = req.body;
            if(!voucherCode || !purchaseAmount) return next(createError(400, 'Voucher code or Purchase amount is missing'));

            const coupon = await CouponModel.findOne({ couponCode: voucherCode });
            if(!coupon) return next(createError(404, 'Voucher code is invalid'));

            const cart = await CartModel.findOne({ couponCode: voucherCode });
            if(cart) return res.status(200).json({ voucher: { code: coupon.couponCode, percentage: coupon.discountPercentage }, message: 'Voucher has been already applied' });
            
            if(Number(purchaseAmount) < coupon.minimumAmount) return next(createError(406, `Please make an order of at least $${coupon.minimumAmount} to avail this Voucher`));

            if(new Date(coupon.validity).getTime() < new Date().getTime()) return next(createError(410, 'Voucher code has been expired!'));
            
            const dataToUpdate = { couponCode: coupon.couponCode, couponDiscountPercentage: coupon.discountPercentage, couponMinimumAmount: coupon.minimumAmount };
            await CartModel.findByIdAndUpdate({ _id }, { $set: dataToUpdate });

            res.status(200).json({
                voucher: { code: coupon.couponCode, percentage: coupon.discountPercentage },
                message: 'Voucher has been applied successfully'
            });

        }catch(err){
            next(err);
        }
    }
}

module.exports = new CartController;