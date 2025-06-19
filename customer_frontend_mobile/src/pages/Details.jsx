// @ts-ignore
import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate, useParams } from "react-router-dom";
import { Tag, Store, Calendar, MapPin } from "lucide-react";
import api from "../Api";

// Make sure you’ve set REACT_APP_UNSPLASH_ACCESS_KEY in your .env
// @ts-ignore
const UNSPLASH_ACCESS_KEY = process.env.REACT_APP_UNSPLASH_ACCESS_KEY;

export const DetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState({
    name: "",
    description: "",
    governmentPrice: 0,
    updatedDate: "",
    retailers: [],
    imageUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchDetailAndImage = async () => {
      try {
        const res = await api.get(`/product/prices/full/${id}`);
        const d = res.data;
        const name = d.Product.ProductName;
        const description = d.Product.Description;
        const governmentPrice = d.GovPrice.SuggestedPrice;
        const updatedDate = d.GovPrice.StartDate;
        const retailers = d.SupermarketPrices.map((sp) => ({
          name: sp.SupermarketName,
          price: sp.Price,
          address: sp.SupermarketAddress,
        }));

        let imageUrl = "";
        const tag = encodeURIComponent(name.toLowerCase());
        try {
          const unsplashRes = await fetch(
            `https://api.unsplash.com/search/photos?query=${tag}&per_page=1&client_id=${UNSPLASH_ACCESS_KEY}`
          );
          const unsplashJson = await unsplashRes.json();
          if (unsplashJson.results?.length) {
            imageUrl = unsplashJson.results[0].urls.small;
          } else {
            const fbRes = await fetch(
              `https://api.unsplash.com/search/photos?query=fruit,vegetable&per_page=1&client_id=${UNSPLASH_ACCESS_KEY}`
            );
            const fbJson = await fbRes.json();
            if (fbJson.results?.length) {
              imageUrl = fbJson.results[0].urls.small;
            }
          }
        } catch (e) {
          console.warn("Unsplash lookup failed:", e);
        }
        if (!imageUrl) {
          imageUrl = "/logo.png";
        }

        setDetail({
          name,
          description,
          governmentPrice,
          updatedDate,
          retailers,
          imageUrl,
        });
      } catch {
        console.error("Failed to load product details");
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailAndImage();
  }, [id]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-3 text-center text-danger">Product not found</div>;
  }

  const formattedDate = detail.updatedDate
    ? new Date(detail.updatedDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const openModal = (r) => {
    setSelectedRetailer(r);
    setShowModal(true);
  };

  return (
    <>
      <div className="d-flex flex-column bg-light" style={{ height: "100svh" }}>
        <nav className="navbar navbar-light bg-light">
          <div className="container-fluid justify-content-center pb-2 shadow-sm">
            <a className="navbar-brand" href="#">
              <img src="/logo.png" alt="VIGL Logo" width="120" />
            </a>
          </div>
        </nav>

        <div className="px-3 pt-3  text-center">
          <h1 className="h1 text-dark fw-bold mb-2">{detail.name}</h1>
          <img
            src={detail.imageUrl}
            alt={detail.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/logo.png";
            }}
            className="mb-3 rounded"
            style={{
              width: "100%",
              height: "200px",
              objectFit: "cover",
            }}
          />
        </div>

        <div className="flex-grow-1 overflow-auto px-3 pt-3">
          <div className="card mb-4 shadow-sm rounded-3 border-0">
            <div className="card-body">
              <h6 className="text-uppercase fw-bold small mb-2">Description</h6>
              <p className="text-muted mb-3">{detail.description}</p>

              <h6 className="text-uppercase fw-bold small mb-2">
                Government Price
              </h6>
              <div className="d-flex align-items-center mb-2">
                <Tag size={16} className="me-2 text-muted" />
                <span className="badge bg-success fs-6">
                  {detail.governmentPrice} TL
                </span>
              </div>
              {formattedDate && (
                <div className="d-flex align-items-center text-muted small">
                  <Calendar size={14} className="me-1" />
                  <span>Last Price Change: {formattedDate}</span>
                </div>
              )}
            </div>
          </div>

          <h6 className="text-uppercase fw-bold small mb-2">Available at</h6>
          <div className="list-group">
            {detail.retailers.map((r) => (
              <button
                // @ts-ignore
                key={r.name}
                type="button"
                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center mb-2 rounded-3 shadow-sm"
                onClick={() => openModal(r)}
              >
                <div className="d-flex align-items-center">
                  <Store size={16} className="me-2 text-muted" />
                  <span className="fw-medium">
                    {
                      // @ts-ignore
                      r.name
                    }
                  </span>
                </div>
                <span className="fw-bold">
                  {
                    // @ts-ignore
                    r.price
                  }{" "}
                  TL
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-3 pb-4">
          <button
            className="btn btn-success w-100 rounded-pill"
            style={{ backgroundColor: "#738844" }}
            onClick={() => navigate("/")}
          >
            Back
          </button>
        </div>
      </div>

      {showModal && selectedRetailer && (
        <>
          <div className="modal-backdrop fade show" />
          <div
            className="modal d-block"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content rounded-3 shadow">
                <div className="modal-header">
                  <h5 className="modal-title d-flex align-items-center">
                    <MapPin size={16} className="me-2 text-muted" />
                    {
                      // @ts-ignore
                      selectedRetailer.name
                    }{" "}
                    Location
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  />
                </div>
                <div className="modal-body">
                  <p className="mb-0">
                    {
                      // @ts-ignore
                      selectedRetailer.address
                    }
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary rounded-pill"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
