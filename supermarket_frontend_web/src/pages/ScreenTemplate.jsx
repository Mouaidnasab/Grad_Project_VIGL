// src/components/TemplateDesigner.jsx
import React, { useEffect } from "react";
import BootstrapNavbar from "../component/BootstrapNavbar";
import "../Css/TemplateDesigner.css";
import api from "../Api.js"; 

const TemplateDesigner = () => {
  useEffect(() => {

    const canvasContainer = document.getElementById("canvas");
    const addTextButton = document.getElementById("add-text");
    const addBarcodeButton = document.getElementById("add-barcode");
    const addQrCodeButton = document.getElementById("add-qrcode");
    const generateButton = document.getElementById("generate");
    const loadTemplateBtn = document.getElementById("load-template");
    const templateSelect = document.getElementById("template-select");
    const contextMenu = document.getElementById("context-menu");
    const templateNameInput = document.getElementById("template-name");
    const previewImg = document.getElementById("preview-img");
    let previewTimer = null; 
    let selectedElement = null;
    let templatesCache = {};


    function attachCommonEvents(element) {
      let isDragging = false,
        offsetX = 0,
        offsetY = 0;

      element.addEventListener("mousedown", (e) => {
        if (e.button === 2) return; 
        isDragging = true;
        offsetX = e.offsetX;
        offsetY = e.offsetY;
        element.style.cursor = "grabbing";
        schedulePreview();
      });

      document.addEventListener("mousemove", (e) => {
        if (isDragging) {
          const canvasRect = canvasContainer.getBoundingClientRect();
          const elementWidth = element.offsetWidth;
          const elementHeight = element.offsetHeight;
          let newX = e.pageX - canvasRect.left - offsetX;
          let newY = e.pageY - canvasRect.top - offsetY;
          newX = Math.max(0, Math.min(newX, canvasRect.width - elementWidth));
          newY = Math.max(
            0,
            Math.min(newY, canvasRect.height - elementHeight)
          );
          element.style.left = `${newX}px`;
          element.style.top = `${newY}px`;
        }
        schedulePreview();
      });

      document.addEventListener("mouseup", () => {
        isDragging = false;
        element.style.cursor = "default";
        if (
          parseInt(element.style.left) + element.offsetWidth >
          canvasContainer.offsetWidth
        ) {
          element.style.width = `${
            canvasContainer.offsetWidth - parseInt(element.style.left)
          }px`;
        }
        if (
          parseInt(element.style.top) + element.offsetHeight >
          canvasContainer.offsetHeight
        ) {
          element.style.height = `${
            canvasContainer.offsetHeight - parseInt(element.style.top)
          }px`;
        }
        schedulePreview();
      });

      element.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        selectedElement = element;
        contextMenu.style.left = `${e.pageX}px`;
        contextMenu.style.top = `${e.pageY}px`;
        contextMenu.style.display = "block";
      });
    }


    function createElement(type) {
      const element = document.createElement("div");
      element.className = `element ${type}`;
      element.style.left = "50px";
      element.style.top = "50px";
      element.style.width = "100px";
      element.style.height =
        type === "barcode" || type === "qrcode" ? "100px" : "50px";
      element.style.textAlign = "center";
      element.style.justifyContent = "center";
      element.style.alignItems = "center";

      if (type === "text") {
        element.contentEditable = "true";
        element.innerText = "Edit Me";
      } else if (type === "barcode") {
        element.contentEditable = "true";
        element.innerText = "Barcode";
      } else if (type === "qrcode") {
        element.contentEditable = "true";
        element.innerText = "QR Code";
      }

      attachCommonEvents(element);
      canvasContainer.appendChild(element);
      schedulePreview();
    }


    function createElementFromData(data) {
      const element = document.createElement("div");
      element.className = `element ${data.type}`;
      element.style.left = `${data.x}px`;
      element.style.top = `${data.y}px`;
      element.style.width = `${data.width}px`;
      element.style.height = `${data.height}px`;
      element.style.color = data.color || "black";
      element.style.backgroundColor = data.fill_color || "transparent";
      element.style.transform = `rotate(${data.rotation || 0}deg)`;
      element.style.justifyContent = data.horizontal_alignment || "center";
      element.style.alignItems = data.vertical_alignment || "center";

      if (["text", "barcode", "qrcode"].includes(data.type)) {
        element.contentEditable = "true";
        element.innerText = data.text || "";
        if (data.font_size) {
          element.style.fontSize = `${data.font_size}px`;
        }
      }
      attachCommonEvents(element);
      canvasContainer.appendChild(element);
    }

  async function loadTemplatesList() {
    try {
      const response = await api.get("/screen/get_screen_templates");
      const data = response.data; 

      templatesCache = data;

      templateSelect.innerHTML = '<option value="">-- Select Template --</option>';
      Object.keys(data).forEach((name) => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        templateSelect.appendChild(opt);
      });
    } catch (err) {
      console.error("Failed to load templates:", err);
    }
  }


    function clearCanvas() {
      canvasContainer.innerHTML = "";
    }

    function loadSelectedTemplate() {
      const key = templateSelect.value;
      if (!key) return;
      const tpl = templatesCache[key];
      if (!tpl) return;

      clearCanvas();
      templateNameInput.value = key;
      tpl.elements.forEach(createElementFromData);
    }


    generateButton.addEventListener("click", (event) => {
      event.preventDefault();
      const elements = [...document.getElementsByClassName("element")].map(
        (element) => {
          const rect = element.getBoundingClientRect();
          const canvasRect = canvasContainer.getBoundingClientRect();
          return {
            type: element.classList.contains("text")
              ? "text"
              : element.classList.contains("barcode")
              ? "barcode"
              : element.classList.contains("qrcode")
              ? "qrcode"
              : "rectangle",
            x: rect.left - canvasRect.left - 1,
            y: rect.top - canvasRect.top,
            width: rect.width,
            height: rect.height,
            text:
              element.classList.contains("text") ||
              element.classList.contains("barcode") ||
              element.classList.contains("qrcode")
                ? element.innerText
                : null,
            color: element.style.color || "black",
            fill_color: element.style.backgroundColor || "transparent",
            rotation:
              parseInt(element.style.transform.replace(/[^0-9-]/g, "")) || 0,
            horizontal_alignment: element.style.justifyContent,
            vertical_alignment: element.style.alignItems,
            font_size: element.classList.contains("text")
              ? parseInt(getComputedStyle(element).fontSize)
              : null,
          };
        }
      );

      api.post("/screen/add_screen_template", {
        body: JSON.stringify({
          template_name: templateNameInput.value,
          elements,
        }),
      })
        .then((response) => response.json())
        .then((data) => console.log("Response:", data))
        .catch((error) => console.error("Error:", error));
    });


    document
      .getElementById("delete-element")
      .addEventListener("click", () => {
        if (selectedElement) {
          canvasContainer.removeChild(selectedElement);
          selectedElement = null;
          contextMenu.style.display = "none";
        }
        schedulePreview();
      });

    document
      .getElementById("rotate-element")
      .addEventListener("click", () => {
        if (selectedElement) {
          const rotation = prompt("Enter rotation angle (degrees):", "0");
          if (rotation)
            selectedElement.style.transform = `rotate(${rotation}deg)`;
          contextMenu.style.display = "none";
        }
        schedulePreview();
      });

    document.getElementById("align-left").addEventListener("click", () => {
      if (selectedElement) selectedElement.style.justifyContent = "flex-start";
      contextMenu.style.display = "none";
      schedulePreview();
    });
    document.getElementById("align-center").addEventListener("click", () => {
      if (selectedElement) selectedElement.style.justifyContent = "center";
      contextMenu.style.display = "none";
      schedulePreview();
    });
    document.getElementById("align-right").addEventListener("click", () => {
      if (selectedElement) selectedElement.style.justifyContent = "flex-end";
      contextMenu.style.display = "none";
      schedulePreview();
    });

    document.getElementById("align-top").addEventListener("click", () => {
      if (selectedElement) selectedElement.style.alignItems = "flex-start";
      contextMenu.style.display = "none";
      schedulePreview();
    });
    document
      .getElementById("align-middle")
      .addEventListener("click", () => {
        if (selectedElement) selectedElement.style.alignItems = "center";
        contextMenu.style.display = "none";
        schedulePreview();
      });
    document.getElementById("align-bottom").addEventListener("click", () => {
      if (selectedElement) selectedElement.style.alignItems = "flex-end";
      contextMenu.style.display = "none";
      schedulePreview();
    });

    document
      .querySelectorAll("#color-picker-container button")
      .forEach((button) => {
        button.addEventListener("click", () => {
          if (selectedElement)
            selectedElement.style.color = button.style.backgroundColor;
          contextMenu.style.display = "none";
          schedulePreview();
        });
      });

    document
      .querySelectorAll("#fill-picker-container button")
      .forEach((button) => {
        button.addEventListener("click", () => {
          if (selectedElement)
            selectedElement.style.backgroundColor =
              button.style.backgroundColor;
          contextMenu.style.display = "none";
          schedulePreview();
        });
      });

    document.getElementById("font-size").addEventListener("click", () => {
      if (selectedElement) {
        const fontSize = prompt("Enter font size (px):", "16");
        if (fontSize) selectedElement.style.fontSize = `${fontSize}px`;
        contextMenu.style.display = "none";
      }
      schedulePreview();
    });

    document.addEventListener("click", () => {
      contextMenu.style.display = "none";
    });


    function copyToClipboard(text) {
      navigator.clipboard
        .writeText(text)
        .catch((err) => console.error("Failed to copy: ", err));
    }
    document
      .querySelectorAll("#dynamic-content button")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const txt = btn.previousElementSibling.innerText;
          copyToClipboard(txt);
        });
      });


    function collectElements() {
      return [...document.getElementsByClassName("element")].map((el) => {
        const rect = el.getBoundingClientRect();
        const crect = canvasContainer.getBoundingClientRect();
        return {
          type: el.classList.contains("text")
            ? "text"
            : el.classList.contains("barcode")
            ? "barcode"
            : el.classList.contains("qrcode")
            ? "qrcode"
            : "rectangle",
          x: rect.left - crect.left - 1,
          y: rect.top - crect.top,
          width: rect.width,
          height: rect.height,
          text: el.innerText,
          color: el.style.color || "black",
          fill_color: el.style.backgroundColor || "transparent",
          rotation: parseInt(el.style.transform.replace(/[^0-9-]/g, "")) || 0,
          horizontal_alignment: el.style.justifyContent || "center",
          vertical_alignment: el.style.alignItems || "center",
          font_size: el.classList.contains("text")
            ? parseInt(getComputedStyle(el).fontSize)
            : 16,
        };
      });
    }


function sendPreview() {
  const payload = {
    template_name: "preview",
    elements: collectElements(),
  };

  api
    .post(
      "/screen/preview_png",
      payload,
      { responseType: "blob" } 
    )
    .then((response) => {
      const blob = response.data;
      previewImg.src = URL.createObjectURL(blob);
      console.log("previewImg.src", previewImg.src);
    })
    .catch((err) => console.error("preview_png error", err));
}



    function schedulePreview() {
      clearTimeout(previewTimer);
      previewTimer = setTimeout(sendPreview, 400);
    }

    addTextButton.addEventListener("click", () => createElement("text"));
    addBarcodeButton.addEventListener("click", () =>
      createElement("barcode")
    );
    addQrCodeButton.addEventListener("click", () =>
      createElement("qrcode")
    );


    loadTemplateBtn.addEventListener("click", loadSelectedTemplate);


    loadTemplatesList();

  }, []); 

  return (
    <div>
            <BootstrapNavbar />

      <h1 className="mt-4">Template Designer</h1>

      <div id="toolbar">
        <select id="template-select">
          <option value="">-- Select Template --</option>
        </select>
        <button id="load-template">Load Template</button>
        <input id="template-name" type="text" placeholder="Template Name" />
        <button id="add-text">Add Text</button>
        <button id="add-barcode">Add Barcode</button>
        <button id="add-qrcode">Add QR Code</button>
        <button id="generate">Save / Generate</button>
      </div>

      <div id="canvas-container">
        <div id="canvas"></div>
      </div>

      <div id="preview-container" style={{ marginTop: "12px" }}>
        <h2 style={{ margin: "6px 0" }}>Live Preview</h2>
        <img
          id="preview-img"
          width="360"
          height="240"
          style={{ border: "1px solid #ccc", background: "#eee" }}
          alt="live preview"
        />
      </div>

      <div id="dynamic-content">
        <div className="section-title">
          You can use one of these to have dynamic content
        </div>
        <div className="item">
          <span>Product Name</span>
        </div>
        <div className="item">
          <span>dynamic:ProductName</span>
          <button>Copy</button>
        </div>
        <div className="item">
          <span>Category</span>
        </div>
        <div className="item">
          <span>dynamic:CategoryName</span>
          <button>Copy</button>
        </div>
        <div className="item">
          <span>Price without promotion</span>
        </div>
        <div className="item">
          <span>dynamic:Price</span>
          <button>Copy</button>
        </div>
        <div className="item">
          <span>Promotion Percentage</span>
        </div>
        <div className="item">
          <span>dynamic:Discount</span>
          <button>Copy</button>
        </div>
        <div className="item">
          <span>Final price</span>
        </div>
        <div className="item">
          <span>dynamic:FinalPrice</span>
          <button>Copy</button>
        </div>
        <div className="item">
          <span>Barcode Dynamic (ProductID)</span>
        </div>
        <div className="item">
          <span>dynamic:ProductID</span>
          <button>Copy</button>
        </div>
      </div>

      <div id="context-menu">
        <button id="delete-element">Delete</button>
        <button id="rotate-element">Rotate</button>
        <label>Align Horizontal:</label>
        <button id="align-left">Align Left</button>
        <button id="align-center">Align Center</button>
        <button id="align-right">Align Right</button>
        <label>Align Vertical:</label>
        <button id="align-top">Align Top</button>
        <button id="align-middle">Align Middle</button>
        <button id="align-bottom">Align Bottom</button>
        <div id="color-picker-container">
          <label>Text Color:</label>
          <button
            id="text-color-black"
            style={{ backgroundColor: "black", color: "white" }}
          >
            T
          </button>
          <button
            id="text-color-white"
            style={{ backgroundColor: "white", border: "1px solid black" }}
          >
            T
          </button>
          <button
            id="text-color-red"
            style={{ backgroundColor: "red", color: "white" }}
          >
            T
          </button>
        </div>
        <div id="fill-picker-container">
          <label>Fill Color:</label>
          <button id="fill-color-black" style={{ backgroundColor: "black" }} />
          <button
            id="fill-color-white"
            style={{ backgroundColor: "white", border: "1px solid black" }}
          />
          <button id="fill-color-red" style={{ backgroundColor: "red" }} />
        </div>
        <button id="font-size">Change Font Size</button>
      </div>
    </div>
  );
};

export default TemplateDesigner;
