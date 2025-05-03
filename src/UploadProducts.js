// UploadProducts.js
import React from 'react';
import { db } from './firebase'; // adjust the path to your firebase config
import { collection, addDoc } from 'firebase/firestore';

const products = [
  { name: "Tomatoes", price: "₹30/kg", image: "/img/tomatoes.jpg", category: "Vegetables" },
  { name: "Potatoes", price: "₹20/kg", image: "/img/potatoes.jpg", category: "Vegetables" },
  { name: "Wheat", price: "₹40/kg", image: "/img/wheat.jpg", category: "Grains" },
  { name: "Onion", price: "₹100/kg", image: "/img/onion.jpg", category: "Vegetables" },
  { name: "Lady's Finger", price: "₹50/kg", image: "/img/ladysfinger.jpg", category: "Vegetables" },
  { name: "Cabbage", price: "₹70/kg", image: "/img/cabbage.jpg", category: "Vegetables" },
  { name: "Drumstick", price: "₹60/kg", image: "/img/drumstick.jpg", category: "Vegetables" },
  { name: "Brinjal", price: "₹50/kg", image: "/img/brinjal.jpg", category: "Vegetables" },
  { name: "Radish", price: "₹40/kg", image: "/img/radish.jpg", category: "Vegetables" },
  { name: "Beetroot", price: "₹100/kg", image: "/img/beetroot.jpg", category: "Vegetables" },
  { name: "Kohlrabi", price: "₹50/kg", image: "/img/kohlrabi.jpg", category: "Vegetables" },
  { name: "Ridge gourd", price: "₹70/kg", image: "/img/ridgegourd.jpg", category: "Vegetables" },
  { name: "Capsicum", price: "₹20/kg", image: "/img/capsicum.jpg", category: "Vegetables" },
  { name: "Taro root", price: "₹70/kg", image: "/img/taroroot.jpg", category: "Root Vegetables" },
  { name: "Elephant yam", price: "₹60/kg", image: "/img/elephantyam.jpg", category: "Root Vegetables" },
  { name: "Beans", price: "₹50/kg", image: "/img/beans.jpg", category: "Vegetables" },
  { name: "Flat beans", price: "₹40/kg", image: "/img/flatbeans.jpg", category: "Vegetables" },
  { name: "Carrot", price: "₹30/kg", image: "/img/carrot.jpg", category: "Root Vegetables" },
  { name: "Cluster beans", price: "₹60/kg", image: "/img/clusterbeans.jpg", category: "Vegetables" },
  { name: "Agathi keerai", price: "₹210/kg", image: "/img/agathikeerai.jpg", category: "Leafy Greens" },
  { name: "Sessile joyweed", price: "₹240/kg", image: "/img/sessilejoyweed.jpg", category: "Leafy Greens" },
  { name: "Thandu keerai", price: "₹180/kg", image: "/img/thandukeerai.jpg", category: "Leafy Greens" },
  { name: "Ponnanganni keerai", price: "₹150/kg", image: "/img/ponnangannikeerai.jpg", category: "Leafy Greens" },
  { name: "Toor dal", price: "₹160/kg", image: "/img/toordal.jpg", category: "Pulses" },
  { name: "Chana dal", price: "₹140/kg", image: "/img/chanadal.jpg", category: "Pulses" },
  { name: "Urad dal", price: "₹140/kg", image: "/img/uraddal.jpg", category: "Pulses" },
  { name: "Moong dal", price: "₹180/kg", image: "/img/moongdal.jpg", category: "Pulses" },
];

const UploadProducts = () => {
  const handleUpload = async () => {
    const productRef = collection(db, "products");

    for (const product of products) {
      try {
        await addDoc(productRef, product);
        console.log(`✅ Uploaded: ${product.name}`);
      } catch (err) {
        console.error(`❌ Error uploading ${product.name}:`, err);
      }
    }

    alert("🎉 All products uploaded to Firestore!");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>One-Time Product Uploader</h2>
      <button onClick={handleUpload}>Upload Products</button>
    </div>
  );
};

export default UploadProducts;
