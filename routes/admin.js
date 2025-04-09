var express = require('express');
const { addProduct } = require('../helpers/product-helpers');
const productHelpers = require('../helpers/product-helpers');
const { response } = require('../app');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
    res.render('admin/admin-page',{admin:true,products})
  })
  
});
router.get('/add-product',(req,res)=>{
  res.render('admin/admin-addpro',{admin:true})
})
router.post('/add-product',(req,res)=>{

  addProduct(req.body,(id)=>{
    let image=req.files.Image
    console.log(__dirname);
    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
      if(!err){
        res.redirect('add-product')
      }else{
        console.log(err);
      }
    })
  })
})
router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
productHelpers.deleteProduct(proId).then((response)=>{
  console.log(response);
res.redirect('/admin')
})
  })


 router.get('/edit-product/:id',async(req,res)=>{
    let proId=req.params.id
    let product = await productHelpers.getProductDetails(proId)
      res.render('admin/edit-product',{admin:true,product})
      console.log(product);
    })
  
router.post('/edit-product/:id',(req,res)=>{
  productHelpers.updateProduct(req.params.id,req.body)
  res.redirect('/admin')
  if(req.files.Image){
    let image= req.files.Image
    image.mv('./public/product-images/'+req.params.id+'.jpg')}
})

router.get('/admin/all-orders',async(req,res)=>{
 let orders = await productHelpers.getAllOders().then((order)=>{
  console.log(order);
 })

  res.render('user/orders')
})
    
  
module.exports = router;
