// ProductsTab.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Boxes,
  PlusCircle,
  MoreHorizontal,
  Edit3,
  DollarSign,
  MessageSquarePlus,
} from "lucide-react";
import api from "../Api.js";
import {
  CommonTopBar,
  AddProductModal,
  EditProductModal,
  EditPriceModal,
  SuggestedProductsModal,
} from "./CommonComponents";
import { createPortal } from "react-dom";

const ProductActionMenu = ({ product, onEdit, onEditPrice }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const closeTimeout = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  const clearClose = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  };
  const scheduleClose = () => {
    clearClose();
    closeTimeout.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => () => clearClose(), []);

  // Recalculate position on open
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    let left = rect.left + window.scrollX;
    if (menuRef.current) {
      const menuWidth = menuRef.current.offsetWidth;
      left = rect.right + window.scrollX - menuWidth;
    }
    setMenuStyle({
      position: "absolute",
      top: rect.bottom + window.scrollY + 4,
      left,
      zIndex: 9999,
    });
  }, [open]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={clearClose}
        onMouseLeave={scheduleClose}
        style={{ display: "inline-block" }}
      >
        <button
          className="action-menu-trigger"
          onClick={() => {
            clearClose();
            setOpen((o) => !o);
          }}
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="action-dropdown-menu"
            style={menuStyle}
            onMouseEnter={clearClose}
            onMouseLeave={scheduleClose}
          >
            <button
              className="action-dropdown-item"
              onClick={() => {
                onEdit(product);
                setOpen(false);
              }}
            >
              <Edit3 size={16} /> Edit Product
            </button>
            <button
              className="action-dropdown-item"
              onClick={() => {
                onEditPrice(product);
                setOpen(false);
              }}
            >
              <DollarSign size={16} /> Edit Price
            </button>
          </div>,
          document.body
        )}
    </>
  );
};

export default function ProductsTab() {
  // Main products state
  const [products, setProducts] = useState([]);
  const [sel, setSel] = useState(null);

  // Modal visibility state
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [suggestedOpen, setSuggestedOpen] = useState(false);

  // Pagination
  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);

  // Suggested-products state
  const [suggestions, setSuggestions] = useState([]);

  // Load products
  const RefreshTable = async () => {
    try {
      const { data } = await api.get("/product/get/");
      const mapped = data.map((item) => ({
        id: item.Product.ProductID,
        name: item.Product.ProductName,
        category: item.Category.CategoryName,
        description: item.Product.Description,
        price: item.Price.SuggestedPrice,
        threshold: item.Price.Threshold,
      }));
      setProducts(mapped);
    } catch (e) {
      console.error("load products failed", e);
    }
  };

  // Load suggestions
  const fetchSuggestions = async () => {
    try {
      const { data } = await api.get("/product/get_suggested_products/");
      const raw = data.suggested_products;
      const arr = Array.isArray(raw)
        ? raw.map((entry, i) => ({ id: i + 1, ...entry }))
        : Object.entries(raw).map(([key, entry]) => ({
            id: parseInt(key, 10),
            ...entry,
          }));
      // attach empty fields
      setSuggestions(
        arr.map((item) => ({
          ...item,
          barcode: item.Barcode || "",
          price: item.SuggestedPrice || "",
          threshold: item.Threshold || "",
        }))
      );
    } catch (e) {
      console.error("Failed to load suggestions", e);
    }
  };

  // Fetch on mount
  useEffect(() => {
    RefreshTable();
  }, []);

  // Reset page when products change
  useEffect(() => {
    setCurrentPage(1);
  }, [products]);

  // Fetch suggestions when modal opens
  useEffect(() => {
    if (suggestedOpen) fetchSuggestions();
  }, [suggestedOpen]);

  // Pagination calculations
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = products.slice(indexOfFirst, indexOfLast);

  // Handlers for CRUD operations
  const handleAddProduct = async (payload) => {
    try {
      await api.post("/product/create/", {
        Barcode: payload.barcode,
        SuggestedPrice: payload.price,
        Threshold: payload.threshold,
        ProductName: payload.name,
        CategoryID: payload.categoryId,
        Description: payload.description,
      });
      await RefreshTable();
    } catch (e) {
      console.error("create product failed", e);
    } finally {
      setAddOpen(false);
    }
  };

  const handleUpdateProduct = async (upd) => {
    try {
      await api.put(`/product/update/${upd.id}/`, {
        ProductName: upd.name,
        Description: upd.description,
        SuggestedPrice: upd.price,
        Threshold: upd.threshold,
      });
      await RefreshTable();
    } catch (e) {
      console.error("update product failed", e);
    } finally {
      setEditOpen(false);
      setPriceOpen(false);
    }
  };

  // Suggested-products handlers
  const onFieldChange = (id, field, value) => {
    setSuggestions((prev) =>
      prev.map((x) => (x.id === id ? { ...x, [field]: value } : x))
    );
  };

  const handleAccept = async (id) => {
    const s = suggestions.find((x) => x.id === id);
    if (!s.barcode || !s.price || !s.threshold) {
      return alert("Please fill in barcode, price and threshold");
    }
    try {
      // create product
      await api.post("/product/create/", {
        Barcode: s.barcode,
        SuggestedPrice: s.price,
        Threshold: s.threshold,
        ProductName: s.ProductName,
        CategoryID: s.CategoryID,
        Description: s.Description,
      });
      // delete suggestion
      await api.delete(`/product/delete_suggested_product/${id}/`);
      setSuggestions((prev) => prev.filter((x) => x.id !== id));
      RefreshTable();
    } catch (e) {
      console.error("Accept failed", e);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.delete(`/product/delete_suggested_product/${id}/`);
      setSuggestions((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      console.error("Reject failed", e);
    }
  };

  return (
    <section className="products-page-content">
      <CommonTopBar title="Products Management" />

      <div className="page-actions-header">
        <h3 className="page-section-title">
          <Boxes size={28} className="title-icon" /> All Products
        </h3>
        <div>
          <button
            className="add-new-button page-main-action-button"
            onClick={() => setSuggestedOpen(true)}
          >
            <MessageSquarePlus size={18} />
            Suggested Products
          </button>
          <button
            style={{ marginLeft: 12 }}
            className="add-new-button page-main-action-button"
            onClick={() => setAddOpen(true)}
          >
            <PlusCircle size={18} /> Add New Product
          </button>
        </div>
      </div>

      <div className="content-panel">
        <div className="table-container">
          <table className="supermarket-table-v2">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>Name</th>
                <th>Description</th>
                <th>Price (₺)</th>
                <th>Threshold (₺)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((prod) => (
                <tr key={prod.id}>
                  <td>{prod.id}</td>
                  <td>{prod.category}</td>
                  <td>{prod.name}</td>
                  <td>{prod.description}</td>
                  <td style={{ textAlign: "start" }}>
                    {prod.price.toFixed(2)}
                  </td>
                  <td style={{ textAlign: "start" }}>{prod.threshold}</td>
                  <td className="cell-actions">
                    <ProductActionMenu
                      product={prod}
                      onEdit={(p) => {
                        setSel(p);
                        setEditOpen(true);
                      }}
                      onEditPrice={(p) => {
                        setSel(p);
                        setPriceOpen(true);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-container">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      <AddProductModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddProduct}
      />
      <EditProductModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        product={sel}
        onSubmit={handleUpdateProduct}
      />
      <EditPriceModal
        isOpen={priceOpen}
        onClose={() => setPriceOpen(false)}
        product={sel}
        onSubmit={handleUpdateProduct}
      />

      <SuggestedProductsModal
        isOpen={suggestedOpen}
        suggestions={suggestions}
        onClose={() => setSuggestedOpen(false)}
        onFieldChange={onFieldChange}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    </section>
  );
}
