import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "./ProductDetail.css";

const products = [
  {  id: 0,name: "Tomatoes", price: "₹30/kg", image: "/img/tomatoes.jpg", description: "Fresh farm-grown tomatoes.", farmer: "Ramesh Kumar", contact: "9876543210", availability: "In Stock" },
  {  id: 1,name: "Potatoes", price: "₹20/kg", image: "/img/potatoes.jpg", description: "Organically cultivated potatoes.", farmer: "Suresh Patel", contact: "9876543211", availability: "In Stock" },
  {  id: 2,name: "Wheat", price: "₹40/kg", image: "/img/wheat.jpg", description: "High-quality wheat grains.", farmer: "Amit Sharma", contact: "9876543212", availability: "Limited Stock" },
  {  id: 3,name: "Onion", price: "₹100/kg", image: "/img/onion.jpg", description: "Freshly harvested onions.", farmer: "Rajesh Verma", contact: "9876543213", availability: "In Stock" },
  {  id: 4,name: "Lady's Finger", price: "₹50/kg", image: "/img/ladysfinger.jpg", description: "Crisp and fresh lady's finger.", farmer: "Neha Reddy", contact: "9876543214", availability: "In Stock" },
  {  id: 5,name: "Cabbage", price: "₹70/kg", image: "/img/cabbage.jpg", description: "Organically grown cabbage.", farmer: "Anil Kumar", contact: "9876543215", availability: "Out of Stock" },
  {  id: 6,name: "Drumstick", price: "₹60/kg", image: "/img/drumstick.jpg", description: "Nutrient-rich drumsticks.", farmer: "Priya Sharma", contact: "9876543216", availability: "In Stock" },
  {  id: 7,name: "Brinjal", price: "₹50/kg", image: "/img/brinjal.jpg", description: "Fresh and organic brinjals.", farmer: "Vikram Mehta", contact: "9876543217", availability: "Limited Stock" },
  {  id: 8,name: "Radish", price: "₹40/kg", image: "/img/radish.jpg", description: "Crispy and fresh radishes.", farmer: "Pooja Iyer", contact: "9876543218", availability: "In Stock" },
  {  id: 9,name: "Beetroot", price: "₹100/kg", image: "/img/beetroot.jpg", description: "Rich in nutrients and antioxidants.", farmer: "Sandeep Yadav", contact: "9876543219", availability: "In Stock" },
  {  id: 10,name: "Kohlrabi", price: "₹50/kg", image: "/img/kohlrabi.jpg", description: "A crunchy and nutritious vegetable.", farmer: "Manoj Singh", contact: "9876543220", availability: "In Stock" },
  {  id: 11,name: "Ridge gourd", price: "₹70/kg", image: "/img/ridgegourd.jpg", description: "Fresh ridge gourds from local farms.", farmer: "Jyoti Prasad", contact: "9876543221", availability: "Out of Stock" },
  {  id: 12,name: "Capsicum", price: "₹20/kg", image: "/img/capsicum.jpg", description: "Colorful and fresh capsicums.", farmer: "Amit Tiwari", contact: "9876543222", availability: "In Stock" },
  {  id: 13,name: "Taro root", price: "₹70/kg", image: "/img/taroroot.jpg", description: "Nutritious and delicious root vegetable.", farmer: "Sunita Rao", contact: "9876543223", availability: "Limited Stock" },
  {  id:14,name: "Elephant yam", price: "₹60/kg", image: "/img/elephantyam.jpg", description: "A healthy and fiber-rich root.", farmer: "Rahul Gupta", contact: "9876543224", availability: "In Stock" },
  {  id: 15,name: "Beans", price: "₹50/kg", image: "/img/beans.jpg", description: "Freshly picked green beans.", farmer: "Asha Bhat", contact: "9876543225", availability: "In Stock" },
  {  id: 16,name: "Flat beans", price: "₹40/kg", image: "/img/flatbeans.jpg", description: "Soft and tender flat beans.", farmer: "Suresh Nair", contact: "9876543226", availability: "Out of Stock" },
  {  id: 17,name: "Carrot", price: "₹30/kg", image: "/img/carrot.jpg", description: "Bright and crunchy carrots.", farmer: "Kiran Desai", contact: "9876543227", availability: "In Stock" },
  {  id: 18,name: "Cluster beans", price: "₹60/kg", image: "/img/clusterbeans.jpg", description: "Healthy and fiber-rich cluster beans.", farmer: "Nidhi Khandelwal", contact: "9876543228", availability: "Limited Stock" },
  {  id: 19,name: "Agathi keerai", price: "₹210/kg", image: "/img/agathikeerai.jpg", description: "Highly nutritious leafy green.", farmer: "Deepak Chauhan", contact: "9876543229", availability: "In Stock" },
  {  id: 20,name: "Sessile joyweed", price: "₹240/kg", image: "/img/sessilejoyweed.jpg", description: "Medicinal herb with health benefits.", farmer: "Meena Ghosh", contact: "9876543230", availability: "Out of Stock" },
  {  id: 21,name: "Thandu keerai", price: "₹180/kg", image: "/img/thandukeerai.jpg", description: "Iron-rich and healthy greens.", farmer: "Santosh Yadav", contact: "9876543231", availability: "In Stock" },
  {  id:22,name: "Ponnanganni keerai", price: "₹150/kg", image: "/img/ponnangannikeerai.jpg", description: "Traditional leafy vegetable.", farmer: "Kavitha Ramesh", contact: "9876543232", availability: "In Stock" },
  {  id: 23,name: "Toor dal", price: "₹160/kg", image: "/img/toordal.jpg", description: "High-protein lentil for daily use.", farmer: "Rohan Pillai", contact: "9876543233", availability: "Limited Stock" },
  {  id: 24,name: "Chana dal", price: "₹140/kg", image: "/img/chanadal.jpg", description: "Essential ingredient for Indian dishes.", farmer: "Vaishali Joshi", contact: "9876543234", availability: "In Stock" },
  {  id: 25,name: "Urad dal", price: "₹140/kg", image: "/img/uraddal.jpg", description: "Rich in protein and good for digestion.", farmer: "Dilip Mehra", contact: "9876543235", availability: "In Stock" },
  {  id: 26,name: "Moong dal", price: "₹180/kg", image: "/img/moongdal.jpg", description: "Light and easy to digest dal.", farmer: "Aparna Shetty", contact: "9876543236", availability: "Out of Stock" },
  {  id: 27,name: "Masoor dal", price: "₹150/kg", image: "/img/masoordal.jpg", description: "A staple lentil in Indian cuisine.", farmer: "Harish Trivedi", contact: "9876543237", availability: "Limited Stock" },
];

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find((item) => item.id === parseInt(id));

  if (!product) {
    return <h2>Product not found</h2>;
  }

  const handleBuyNow = () => {
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    orders.push(product);
    localStorage.setItem("orders", JSON.stringify(orders));
    navigate("/orders");
  };

  return (
    <div className="product-detail-container">
      <div className="product-detail-wrapper">
        <img src={product.image} alt={product.name} className="product-detail-img" />
        <div className="product-detail-info">
          <h2>{product.name}</h2>
          <p><strong>Price:</strong> {product.price}</p>
          <p><strong>Description:</strong> {product.description}</p>
          <p><strong>Farmer:</strong> {product.farmer}</p>
          <p><strong>Contact:</strong> {product.contact}</p>
          <p><strong>Availability:</strong> {product.availability}</p>
          <button onClick={handleBuyNow} className="buy-button">ADD TO CART</button>
          <Link to="/products" className="back-button">Back to Products</Link>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

