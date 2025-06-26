import React, { useState, useEffect, useRef } from "react";
import {
  Store,
  PlusCircle,
  MoreHorizontal,
  ShoppingBasket,
  AlertTriangle,
  Edit3,
} from "lucide-react";
import { createPortal } from "react-dom";
import api from "../Api.js";
import {
  CommonTopBar,
  EditSupermarketModal,
  ViewProductsModal,
  ViewPenaltiesModal,
  AddSupermarketModal,
} from "./CommonComponents";

const SupermarketActionMenu = ({
  supermarket,
  onEdit,
  onProducts,
  onPenalties,
}) => {
  const [isOpen, setIsOpen] = useState(false);
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
    closeTimeout.current = window.setTimeout(() => setIsOpen(false), 150);
  };

  useEffect(() => () => clearClose(), []);

  useEffect(() => {
    if (!isOpen || !triggerRef.current || !menuRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const w = menuRef.current.offsetWidth;
    setMenuStyle({
      position: "absolute",
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX - w,
      zIndex: 9999,
    });
  }, [isOpen]);

  const handle = (fn) => {
    fn(supermarket);
    setIsOpen(false);
  };

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
          aria-haspopup="true"
          aria-expanded={isOpen}
          onClick={() => {
            clearClose();
            setIsOpen((o) => !o);
          }}
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="action-dropdown-menu"
            style={menuStyle}
            role="menu"
            onMouseEnter={clearClose}
            onMouseLeave={scheduleClose}
          >
            <button
              className="action-dropdown-item"
              role="menuitem"
              onClick={() => handle(onProducts)}
            >
              <ShoppingBasket size={16} />
              <span>View Products</span>
            </button>
            <button
              className="action-dropdown-item"
              role="menuitem"
              onClick={() => handle(onPenalties)}
            >
              <AlertTriangle size={16} />
              <span>View Penalties</span>
            </button>
            <div className="action-dropdown-divider" />
            <button
              className="action-dropdown-item"
              role="menuitem"
              onClick={() => handle(onEdit)}
            >
              <Edit3 size={16} />
              <span>Edit Details</span>
            </button>
          </div>,
          document.body
        )}
    </>
  );
};

export default function SupermarketsTab() {
  const [supermarkets, setSupermarkets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [itemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [prodOpen, setProdOpen] = useState(false);
  const [penOpen, setPenOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [penalties, setPenalties] = useState([]);

  const refreshTable = () => {
    api
      .get("/supermarket/get")
      .then((res) => {
        setSupermarkets(res.data);
        setCurrentPage(1);
      })
      .catch((e) => {
        console.error(e);
        setError("Failed to load supermarkets");
      });
  };

  useEffect(() => {
    setLoading(true);
    refreshTable();
    setLoading(false);
  }, []);

  const totalPages = Math.ceil(supermarkets.length / itemsPerPage);
  const currentItems = supermarkets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddSupermarket = async (data) => {
    setLoading(true);
    try {
      const payload = {
        supermarket: {
          RegisteredName: data.name,
          Address: data.location,
          ContactPersonFullName: data.contactPerson,
          ContactPersonUserID: data.contactId,
        },
        OwnerReq: {
          Username: data.ownerUsername,
          Email: data.contactEmail,
          Password: data.ownerPassword,
        },
      };
      await api.post("/supermarket/create", payload);
      refreshTable();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to add supermarket");
    } finally {
      setLoading(false);
      setAddOpen(false);
    }
  };

  const handleEdit = (sm) => {
    setSelected(sm);
    setEditOpen(true);
  };
  const handleSubmitEdit = async (upd) => {
    setModalLoading(true);
    try {
      await api.put("/supermarket/edit", upd);
      setSupermarkets((list) =>
        list.map((s) =>
          s.SupermarketID === upd.SupermarketID ? { ...s, ...upd } : s
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to save changes");
    } finally {
      setModalLoading(false);
      setEditOpen(false);
      setSelected(null);
    }
  };

  const handleViewProducts = (sm) => {
    setModalLoading(true);
    api
      .get(`/product/get_from_supermarket/${sm.SupermarketID}`)
      .then((res) => {
        const flat = res.data.Products.map((item) => ({
          id: item.Product.ProductID,
          name: item.Product.ProductName,
          category: item.Category.CategoryName,
          price: item.SupermarketPrice?.Price ?? 0,
        }));
        setProducts(flat);
        setSelected(sm);
        setProdOpen(true);
      })
      .catch((e) => {
        console.error(e);
        alert("Failed to load products");
      })
      .finally(() => setModalLoading(false));
  };

  const handleViewPenalties = (sm) => {
    setModalLoading(true);
    api
      .get(`/penalty/get/${sm.SupermarketID}`)
      .then((res) => {
        const flat = res.data.map((item) => ({
          id: item.PenaltyID,
          issuedDate: item.IssuedDate,
          lastPaymentDate: item.LastPaymentDate,
          amount: item.Amount ?? 0,
          reason: item.Reason,
          status: item.Status,
        }));
        setPenalties(flat);
        setSelected(sm);
        setPenOpen(true);
      })
      .catch((e) => {
        console.error(e);
        alert("Failed to load penalties");
      })
      .finally(() => setModalLoading(false));
  };

  const closeAll = () => {
    setAddOpen(false);
    setEditOpen(false);
    setProdOpen(false);
    setPenOpen(false);
    setSelected(null);
  };

  return (
    <section className="supermarkets-page-content">
      <CommonTopBar title="Supermarkets Management" />

      <div className="page-actions-header">
        <h3 className="page-section-title">
          <Store size={28} className="title-icon" />
          All Supermarkets
        </h3>
        <button
          onClick={() => setAddOpen(true)}
          className="add-new-button page-main-action-button"
        >
          <PlusCircle size={18} />
          Add New Supermarket
        </button>
      </div>

      <div className="table-container">
        {loading && <p>Loading…</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && supermarkets.length === 0 && (
          <p className="no-data-message">
            No supermarkets found. Click “Add New Supermarket” to begin.
          </p>
        )}

        {!loading && !error && supermarkets.length > 0 && (
          <>
            <table className="supermarket-table-v2">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Address</th>
                  <th>Contact Person</th>
                  <th>Contact Person ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((sm) => (
                  <tr key={sm.SupermarketID}>
                    <td>{sm.RegisteredName}</td>
                    <td>{sm.Address}</td>
                    <td>{sm.ContactPersonFullName}</td>
                    <td>{sm.ContactPersonUserID}</td>
                    <td className="cell-actions">
                      <SupermarketActionMenu
                        supermarket={sm}
                        onEdit={handleEdit}
                        onProducts={handleViewProducts}
                        onPenalties={handleViewPenalties}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination-container">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      <AddSupermarketModal
        isOpen={addOpen}
        onClose={closeAll}
        onSubmit={handleAddSupermarket}
      />
      {selected && (
        <>
          <EditSupermarketModal
            isOpen={editOpen}
            loading={modalLoading}
            onClose={closeAll}
            onSubmit={handleSubmitEdit}
            supermarketData={selected}
          />
          <ViewProductsModal
            isOpen={prodOpen}
            loading={modalLoading}
            onClose={closeAll}
            supermarketName={selected.RegisteredName}
            products={products}
          />
          <ViewPenaltiesModal
            isOpen={penOpen}
            loading={modalLoading}
            onClose={closeAll}
            supermarketName={selected.RegisteredName}
            penalties={penalties}
          />
        </>
      )}
    </section>
  );
}
