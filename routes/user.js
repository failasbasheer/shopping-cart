var express = require("express");
const productHelpers = require("../helpers/product-helpers");
const { doSignup, doLogin, addToCart } = require("../helpers/user-helpers");
const userHelpers = require("../helpers/user-helpers");
const { response } = require("../app");
var router = express.Router();
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}
/* GET home page. */
router.get("/", async function (req, res, next) {
  let user=req.session.user
  let cartCount=null
  if(req.session.user){
   cartCount= await userHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getAllProducts().then((products)=>{
    res.render("user/index", { products , admin:false,user,cartCount});
  })
});
router.get('/login',(req,res)=>{
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/user-login',{'loginErr':req.session.loginErr})
  req.session.loginErr=false
  }
})
router.get('/signup',(req,res)=>{
  res.render('user/user-signup',{'loginErr':req.session.loginErr})
  req.session.loginErr=false
})

router.post('/signup',(req,res)=>{
  doSignup(req.body).then((response)=>{
     req.session.loggedIn=true
     req.session.user=response
    res.redirect('/')
  }) 
})

router.post('/login',(req,res)=>{
  
      doLogin(req.body).then((response)=>{
        if(response.status){
          req.session.loggedIn=true
          req.session.user=response.user
          res.redirect('/')
        }else{
          req.session.loginErr=true
          res.redirect('/login')
        }
      })
      
})
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/login')
})
router.get('/cart',verifyLogin,async(req,res)=>{
  let user=req.session.user
  let userID=req.session.user._id
  let products= await userHelpers.getCartProducts(req.session.user._id)
  let total= await userHelpers.getTotalAmount(userID)
  let itemCount=products.length
    res.render('user/cart',{user,products,itemCount,total,userID})
  }
)

router.get('/add-to-cart/:id',(req,res)=>{
  addToCart(req.params.id,req.session.user._id).then(()=>{
     res.json({status:true})
  })
})

router.post('/change-product-quantity',(req,res)=>{
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
     response.total= await userHelpers.getTotalAmount(req.body.user)
     res.json(response)
  })
})

router.post('/delete-cart-product',(req,res)=>{
  userHelpers.deleteCartProduct(req.body).then((response)=>{
    res.json(response)
  })
})

router.get('/place-oder',verifyLogin,async(req,res)=>{
  let userID=req.session.user._id
  let user=req.session.user
  let total= await userHelpers.getTotalAmount(userID)
  res.render('user/place-oder',{total,user})
})
router.post('/checkout',async(req,res)=>{
  let products=await userHelpers.getCartProductList(req.body.userID)
  let totalPrice=await userHelpers.getTotalAmount(req.body.userID)
  userHelpers.placeOrder(req.body,products,totalPrice).then((response)=>{
      res.json({status:true})
  })
})
router.get('/complete',(req,res)=>{
  let user = req.session.user
  res.render('user/complete',{user})
})
router.get('/orders',verifyLogin,async(req,res)=>{
  let user = req.session.user
  let oders= await userHelpers.getUserOrders(user._id)
  res.render('user/orders',{user,oders})
})

router.get('/order-products/:id',verifyLogin,async(req,res)=>{
  let orderID=req.params.id
  let user = req.session.user
  let products= await userHelpers.getOrderProducts(req.params.id)
  let orderPro=await userHelpers.viewOrderProducts(orderID)
    res.render('user/orderProducts',{orderPro,orderID,products,user})
})


router.get('/cancel-oder/:id',(req,res)=>{
  orderID=req.params.id
  userHelpers.cancelOder(orderID).then(()=>{
    res.redirect('/orders')
  })
})

router.get('/delete-order-product',verifyLogin,async(req,res)=>{
   let orderID=req.query.orderID
   let proID=req.query.proID
   console.log(proID);
   console.log(orderID);
    await userHelpers.cancelOrderPro(proID,orderID)
     res.redirect('/orders')
 })
module.exports = router;
