import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc
} from "firebase/firestore";
import {
  GoogleMap,
  LoadScript,
  Marker,
  DirectionsRenderer
} from "@react-google-maps/api";

const SupplyChain = () => {
  const [orders, setOrders] = useState([]);
  const [directions, setDirections] = useState({});
  const [loading, setLoading] = useState(true);

  const apiKey = "AIzaSyCR4sCTZyqeLxKMvW_762y5dsH4gfiXRKo"; // Replace with your key

  // Fetch orders and geocode
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "supplyChainOrders"), async (querySnapshot) => {
      const fetchedOrders = await Promise.all(querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const geocoded = await getGeocodedDirections(data.originAddress, data.destinationAddress);
        return {
          id: doc.id,
          ...data,
          originCoords: geocoded.origin,
          destinationCoords: geocoded.destination,
          route: geocoded.route
        };
      }));
      setOrders(fetchedOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getGeocodedDirections = async (origin, destination) => {
    const geocode = async (address) => {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
      );
      const data = await response.json();
      return data.results[0]?.geometry.location;
    };

    const originLoc = await geocode(origin);
    const destLoc = await geocode(destination);

    let route = null;
    if (originLoc && destLoc) {
      const directionsService = new window.google.maps.DirectionsService();
      route = await new Promise((resolve, reject) => {
        directionsService.route(
          {
            origin: originLoc,
            destination: destLoc,
            travelMode: window.google.maps.TravelMode.DRIVING
          },
          (result, status) => {
            if (status === "OK") resolve(result);
            else reject("Failed to get directions");
          }
        );
      });
    }

    return { origin: originLoc, destination: destLoc, route };
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "supplyChainOrders", orderId), { status: newStatus });
      alert(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error(error);
      alert("Update failed");
    }
  };

  return (
    <div style={styles.container}>
      <h2>🚚 Supply Chain & Route Tracker</h2>
      {loading ? (
        <p>Loading map and orders...</p>
      ) : (
        <>
          <div style={styles.mapWrapper}>
            <LoadScript googleMapsApiKey={apiKey}>
              <GoogleMap
                mapContainerStyle={styles.mapContainer}
                center={{ lat: 12.9716, lng: 77.5946 }}
                zoom={7}
              >
                {orders.map((order) => (
                  <>
                    {order.originCoords && (
                      <Marker
                        key={`origin-${order.id}`}
                        position={order.originCoords}
                        label="F"
                      />
                    )}
                    {order.destinationCoords && (
                      <Marker
                        key={`dest-${order.id}`}
                        position={order.destinationCoords}
                        label="B"
                      />
                    )}
                    {order.route && (
                      <DirectionsRenderer
                        directions={order.route}
                        options={{ suppressMarkers: true }}
                      />
                    )}
                  </>
                ))}
              </GoogleMap>
            </LoadScript>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th>Crop</th>
                <th>Buyer</th>
                <th>Status</th>
                <th>Transport</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.crop}</td>
                  <td>{order.buyer}</td>
                  <td style={styles.status[order.status]}>{order.status}</td>
                  <td>{order.transport}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    marginBottom: "30px",
  },
  mapWrapper: {
    width: "100%",
    height: "400px",
    marginBottom: "20px",
  },
  mapContainer: {
    width: "100%",
    height: "100%",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  status: {
    Pending: { color: "red", fontWeight: "bold" },
    "In Transit": { color: "orange", fontWeight: "bold" },
    Shipped: { color: "blue", fontWeight: "bold" },
    Delivered: { color: "green", fontWeight: "bold" },
  },
};

export default SupplyChain;
