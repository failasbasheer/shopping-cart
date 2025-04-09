
const { ObjectId } = require('mongodb');
const db = require('../config/connection');
const { PRODUCT_COLLECTION, ORDER_COLLECTION } = require('./collections');
const { response } = require('express');





module.exports={

     addProduct:(product,callback)=>{

      db.get().collection(PRODUCT_COLLECTION).insertOne(product).then((data)=>{
        const objectId = data.insertedId;
        const id = objectId.toString();
        console.log(id);
        callback(id)
      })
        
      },
      getAllProducts:()=>{
       return new Promise(async(resolve,reject)=>{
        let products = await db.get().collection(PRODUCT_COLLECTION).find().toArray()
          resolve(products)
       })
      },
      deleteProduct:(proId)=>{
            return new Promise((resolve,reject)=>{
               db.get().collection(PRODUCT_COLLECTION).deleteOne({_id:new ObjectId(proId)}).then((response)=>{
                console.log(response);
                resolve(response)
               })
            })
      },
          getProductDetails:(proId)=>{
        return new Promise(async(resolve,reject)=>{
        let product = await db.get().collection(PRODUCT_COLLECTION).findOne({_id:new ObjectId(proId)}).then((product)=>{
          resolve (product)
        })
        
        })
      },
      updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
          db.get().collection(PRODUCT_COLLECTION).updateOne({_id:new ObjectId(proId)},{
              $set:{
                    Name:proDetails.Name,
                    Category:proDetails.Category,
                    Price:proDetails.Price,
                    Description:proDetails.Description
              }
             } )
        }).then((response)=>{
          resolve()
        })
      },
      getAllOders:()=>{
        return new Promise(async(resolve,reject)=>{
         let order= await db.get().collection(ORDER_COLLECTION).find().toArray(function(err, orders) {
          if (err) {
            reject(err);
            return;
          }
          console.log(order);
          resolve(order)
          })
        
      }

    )}
  }


  