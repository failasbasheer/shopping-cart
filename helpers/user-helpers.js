const db = require('../config/connection');
const bcrypt = require('bcrypt');
const { USER_COLLECTION, CART_COLLECTIONS, PRODUCT_COLLECTION } = require('./collections');
const { ObjectId } = require('mongodb');
const { response } = require('express');
const { use, purge } = require('../app');
const collections = require('./collections');
const { ORDER_COLLECTION } = require('./collections');

module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.password=await bcrypt.hash(userData.password,10)
            db.get().collection(USER_COLLECTION).insertOne(userData).then((data)=>{
                userData._id = data.insertedId;
                resolve(userData);
            })
        })
      
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let response={}
            let user = await db.get().collection(USER_COLLECTION).findOne({email:userData.email})
            if(user){
             bcrypt.compare(userData.password,user.password).then((status)=>{
                if(status){
                    console.log('Login succes');
                    response.user=user
                    response.status=true
                    resolve(response)
                }else{
                     response.error='wrong password'
                     console.log(response.error);
                     resolve({status:false})
                
                }
             })
            }else{
                response.error='No user found'
                console.log(response.error);
                resolve({status:false})
            }
        })
    },
    addToCart:(proID,userID)=>{
        let proObj={
        item:new ObjectId(proID),
         quantity:1
        }
     return new Promise(async(resolve,reject)=>{
        let userCart = await db.get().collection(CART_COLLECTIONS).findOne({user:new ObjectId(userID)})
        if(userCart){
            let proExist=userCart.products.findIndex((product)=> product.item==proID)
             console.log(proExist);
             if(proExist!=-1){
                db.get().collection(CART_COLLECTIONS).updateOne({user:new ObjectId(userID),'products.item':new ObjectId(proID)},
                {
                    $inc:{'products.$.quantity':1}
                }
                ).then(()=>{
                    resolve()
                })
             }
             else{
                db.get().collection(CART_COLLECTIONS)
                .updateOne({user:new ObjectId(userID)},
                      {
                            $push:{products:proObj}
                      }
                ).then((response)=>{
                   resolve()
                })
             }
        
        }else{
            let cartObj={
                 user:new ObjectId(userID),
                 products:[proObj]
            }
            db.get().collection(CART_COLLECTIONS).insertOne(cartObj).then((response)=>{
                resolve(response)
            })
        }
     })
    },
    
    getCartProducts:(userID)=>{
        return new Promise(async(resolve,reject)=>{

           let cartItems=await db.get().collection(CART_COLLECTIONS).aggregate([
            {
                $match:{user: new ObjectId(userID)}
            },{
                $unwind:'$products'
            },{
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                },
                
            },{
                $lookup:{
                    from:PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            },{
                $project:{
                    item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                }
            }

           ]).toArray()
           resolve(cartItems)
        }
        )
    },
    getCartCount:(userID)=>{
       return new Promise(async(resolve,reject)=>{
       let count=0
        let cart = await db.get().collection(CART_COLLECTIONS).findOne({user:new ObjectId(userID)})
        if(cart){
            count=cart.products.length
        }
        resolve(count)
       })
    },
    changeProductQuantity:(details)=>{
        count=parseInt(details.count)
        quantity=parseInt(details.quantity)
        return new Promise((resolve,reject)=>{
            if(count==-1 && quantity==1){
                db.get().collection(CART_COLLECTIONS).updateOne(
                    {_id:new ObjectId(details.cart)},
                    {
                        $pull:{products:{item:new ObjectId(details.product)}}
                    }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })
            }else{
            db.get().collection(CART_COLLECTIONS).updateOne({_id:new ObjectId(details.cart),'products.item':new ObjectId(details.product)},
                {
                    $inc:{'products.$.quantity':count}
                }
                ).then((response)=>{
                    resolve({status:true})
                })
            }
        })
    },
    deleteCartProduct:(product)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(CART_COLLECTIONS).updateOne(
                {_id:new ObjectId(product.cart)},
                {
                    $pull:{products:{item:new ObjectId(product.product)}}
                }
            ).then((response)=>{
                resolve({removedProduct:true})
            })
        })
    },
    getTotalAmount:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            let userCart = await db.get().collection(CART_COLLECTIONS).findOne({user:new ObjectId(userID)})
            if(userCart){
            let total=await db.get().collection(CART_COLLECTIONS).aggregate([
             {
                 $match:{user:new ObjectId(userID)}
             },{
                 $unwind:'$products'
             },{
                 $project:{
                     item:'$products.item',
                     quantity:'$products.quantity'
                 },
                 
             },{
                 $lookup:{
                     from:PRODUCT_COLLECTION,
                     localField:'item',
                     foreignField:'_id',
                     as:'product'
                 }
             },{
                 $project:{
                     item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                 }
             },{
                $group:{
                    _id:null,
                    total: {$sum: {$multiply: [{ $toInt: "$quantity" }, { $toInt: "$product.Price" }]}}
                }
             }
 
            ]).toArray()
            resolve(total[0].total);
        }else{
            resolve(total=null)
        }
         }
         )
    },
    placeOrder:(order,products,total)=>{
       return new Promise((resolve,reject)=>{
           let status = order.paymentMethod==='COD'?'placed':'pending'
           let orderObj={
            deliveryDetails:{
                mobile:order.phone,
                address:order.address,
                pincode:order.pin,
            },
            userID:new ObjectId(order.userID),
            paymentMethod:order.paymentMethod,
            products:products,
            totalAmount:total,
            status:status,
            date:new Date()
           }
           db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
            db.get().collection(CART_COLLECTIONS).deleteOne({user:new ObjectId(order.userID)})
            resolve()
           })
       })
    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart = await db.get().collection(CART_COLLECTIONS).findOne({user:new ObjectId(userId)})
             resolve(cart.products)
        })
    },
    getUserOrders:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            let orders= await db.get().collection(collections.ORDER_COLLECTION).find({userID:new ObjectId(userID)}).toArray()
            resolve(orders)
             
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{

            let orderItems=await db.get().collection(CART_COLLECTIONS).aggregate([
             {
                 $match:{user: new ObjectId(orderId)}
             },{
                 $unwind:'$products'
             },{
                 $project:{
                     item:'$products.item',
                     quantity:'$products.quantity'
                 },
                 
             },{
                 $lookup:{
                     from:PRODUCT_COLLECTION,
                     localField:'item',
                     foreignField:'_id',
                     as:'product'
                 }
             },{
                 $project:{
                     item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                 }
             }
 
            ]).toArray()
            resolve(orderItems)
    }
  )},
  cancelOder:(orderId)=>{
    return new Promise(async(resolve,reject)=>{
           await db.get().collection(ORDER_COLLECTION).deleteOne({_id:new ObjectId(orderId)})
            resolve()
    })
  },
  viewOrderProducts:(orderId)=>{
    return new Promise(async(resolve,reject)=>{
        let orders= await db.get().collection(ORDER_COLLECTION).findOne({_id:new ObjectId(orderId)})
        const products = orders.products;
        let productArray=[]
       for(i=0;i<products.length;i++){
        let product = await db.get().collection(PRODUCT_COLLECTION).find({_id:new ObjectId(products[i].item)}).toArray()
          let productObj=Object.assign({},product)
           productArray.push(product)
       }
       resolve(productArray)
    })},
    cancelOrderPro:(proID,orderID)=>{
        return new Promise(async(resolve,reject)=>{
           await db.get().collection(ORDER_COLLECTION).updateOne(
                {_id:new ObjectId(orderID)},
                {
                    $pull:{products:{item:new ObjectId(proID)}}
                }
            ).then((response)=>{
                resolve({removedProduct:true})
            })
        })
    }
}