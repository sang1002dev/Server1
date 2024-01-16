const express = require('express');
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const Product = require("./model/Product");
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs').promises;
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = express.Router();

mongoose
  .connect("mongodb://127.0.0.1:27017/Computer", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Kết nối tới MongoDB thành công.");
  })
  .catch((err) => {
    console.error("Lỗi khi kết nối tới MongoDB: " + err);
  });



 
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  const port = process.env.port || 3001;


app.set('view engine', 'ejs');// cấu hình engine ejs
app.set("views", path.join(__dirname, "views"));


app.get('/insert',(req, res)=>{
    console.log(__dirname);
   res.render("Insert.ejs");
})


app.post('/product', upload.array('image', 2), async (req, res) => {
  try {
    console.log('Received request:', req.body);
    
    console.log('Received files:', req.files);

    const imagePaths = [];
    for (let index = 0; index < req.files.length; index++) {
      const file = req.files[index];
      const fileName = file.originalname || `file_${index + 1}.jpg`;
      const imagePath = path.join(__dirname, 'uploads', fileName);
      const fileNameOnly = path.basename(imagePath);
      console.log(imagePath)
      // Lưu tệp ảnh vào thư mục "uploads"
      await fs.writeFile(imagePath, file.buffer);
      // Lưu đường dẫn vào mảng
      imagePaths.push(fileNameOnly);
    }

    // Lưu thông tin sản phẩm vào MongoDB với danh sách đường dẫn
    const newProduct = new Product({
      name: req.body.name,
      price: req.body.price,
      brand: req.body.brand,
      comments: req.body.comments,
      imagePaths: imagePaths, // Lưu danh sách đường dẫn tệp ảnh
    });

    const result = await newProduct.save();
    res.json(result);
  } catch (error) {
    res.status(500).send('Internal Server Error');
}
});

app.put('/product/:id', upload.array('image', 2), async (req, res) => {
  const productId = req.params.id;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Received request:', req.body);
    console.log('Received files:', req.files);

    

    const updatedImagePaths = [];
    for (let index = 0; index < req.files.length; index++) {
      const file = req.files[index];
      const fileName = file.originalname || `file_${index + 1}.jpg`;
      const imagePath = path.join(__dirname, 'uploads', fileName);
      const fileNameOnly = path.basename(imagePath);

      // Lưu tệp ảnh vào thư mục "uploads"
      await fs.writeFile(imagePath, file.buffer);
      // Lưu đường dẫn vào mảng
      updatedImagePaths.push(fileNameOnly);
    }
    if (updatedImagePaths.length === 0) {
      updatedImagePaths.push(...product.imagePaths);
    }
    // Cập nhật thông tin sản phẩm
    product.name = req.body.name;
    product.price = req.body.price;
    product.brand = req.body.brand;
    product.comments = req.body.comments;
    product.imagePaths = updatedImagePaths;
   
    const result = await product.save();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/product/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    const result = await Product.findByIdAndDelete(productId);

    if (!result) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});




app.get('/list', async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.render('List.ejs', { products: products });
    
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
// Định nghĩa endpoint để lấy toàn bộ sản phẩm
app.get('/api/products', async (req, res) => {
  try {
      const products = await Product.find(); 
      res.json(products); 
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route để thêm đánh giá cho sản phẩm
app.post('/product/comment/:productId', async (req, res) => {
  const productId = req.params.productId;
  const { user, comment } = req.body;

  try {
      const product = await Product.findById(productId);
      if (!product) {
          return res.status(404).json({ message: 'Product not found' });
      }

      product.comments.push({ user, comment });
      const updatedProduct = await product.save();

      res.json({ comments: updatedProduct.comments });
  } catch (error) {
      console.error('Save comment failed:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});
// Endpoint để lấy comment theo productId
router.get('/product/comments/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    console.log(`ProductId before calling loadComments: ${productId}`);

    const comments = await Comment.find({ productId }).exec();

    console.log(`Loading comments for productId: ${productId}`);
    console.log('Comments:', comments);
    res.json({ comments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



module.exports = router;


// Thiết lập cổng cho sever
app.listen(port, ()=>{
    console.log(` server running at the port ${port}`);

});
