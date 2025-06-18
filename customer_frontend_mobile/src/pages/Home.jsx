// @ts-ignore
import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, Barcode, Info } from "lucide-react";
import api from "../Api";

// @ts-ignore
const UNSPLASH_ACCESS_KEY = process.env.REACT_APP_UNSPLASH_ACCESS_KEY;

export const HomePage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [list, setList] = useState([]); // { id, name, price, imageUrl }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductsWithImages = async () => {
      setLoading(true);
      try {
        const res = await api.get("/product/get/");
        const data = Array.isArray(res.data) ? res.data : [];

        const products = data.map((item) => ({
          id: String(item.Product.ProductID),
          name: item.Product.ProductName,
          price: item.Price.SuggestedPrice,
        }));

        const withImages = await Promise.all(
          products.map(async (prod) => {
            const tag = encodeURIComponent(prod.name.toLowerCase());
            let imageUrl = "";

            try {
              const resp = await fetch(
                `https://api.unsplash.com/search/photos?query=${tag}&per_page=1&client_id=${UNSPLASH_ACCESS_KEY}`
              );
              const json = await resp.json();
              if (json.results?.length) {
                imageUrl = json.results[0].urls.small;
              } else {
                const fb = await fetch(
                  `https://api.unsplash.com/search/photos?query=fruit,vegetable&per_page=1&client_id=${UNSPLASH_ACCESS_KEY}`
                );
                const fjson = await fb.json();
                if (fjson.results?.length) {
                  imageUrl = fjson.results[0].urls.small;
                }
              }
            } catch (e) {
              console.warn(`Unsplash error for ${prod.name}:`, e);
            }

            if (!imageUrl) {
              imageUrl = "/logo.png";
            }

            return { ...prod, imageUrl };
          })
        );

        // @ts-ignore
        setList(withImages);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsWithImages();
  }, []);

  const filtered = list.filter((p) =>
    // @ts-ignore
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-success" role="status" />
      </div>
    );
  }

  return (
    <div className="d-flex flex-column bg-light" style={{ height: "100svh" }}>
      <nav className="navbar navbar-light bg-light shadow-sm">
        <div className="container-fluid justify-content-center">
          <a className="navbar-brand" href="#">
            <img src="/logo.png" alt="VIGL Logo" width="120" />
          </a>
        </div>
      </nav>

      <div className="px-3 py-2">
        <div className="input-group">
          <span className="input-group-text bg-white border-end-0 rounded-start">
            <SearchIcon size={18} className="text-muted" />
          </span>
          <input
            type="text"
            className="form-control border-start-0 rounded-end"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-grow-1 overflow-auto px-3 pb-5">
        {filtered.length === 0 && (
          <div className="text-center text-muted mt-5">No products found</div>
        )}
        <div className="row row-cols-1 row-cols-sm-2 g-3">
          {filtered.map((p) => (
            <div className="col" key={p.id}>
              <div
                className="card h-100 shadow-sm border-0 rounded-3"
                onClick={() => navigate(`/product/${p.id}`)}
                style={{ cursor: "pointer" }}
              >
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  loading="lazy"
                  className="rounded-top"
                  style={{ height: 120, objectFit: "cover", width: "100%" }}
                />
                <div className="card-body d-flex flex-column justify-content-between">
                  <h6 className="fw-semibold mb-2 text-truncate">{p.name}</h6>
                  <span className="badge bg-success align-self-end">
                    {p.price} TL
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        className="btn btn-success shadow-lg position-fixed d-flex align-items-center justify-content-center"
        style={{
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: "50%",
          backgroundColor: "#738844",
        }}
        onClick={() => navigate("/scan")}
      >
        <Barcode size={24} className="text-white" />
      </button>

      <button
        className="btn btn-light shadow-lg position-fixed d-flex align-items-center justify-content-center"
        style={{
          bottom: 20,
          left: 20,
          width: 60,
          height: 60,
          borderRadius: "50%",
        }}
        onClick={() => navigate("/about")}
      >
        <Info size={24} className="text-success" />
      </button>
    </div>
  );
};
