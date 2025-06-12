import React, { useEffect } from "react";
import BootstrapNavbar from "../component/BootstrapNavbar";
import "../Css/TemplateDesigner.css";
import api from "../Api.js";
import Footer from "../component/footerInit.jsx";
import { useNavigate } from 'react-router-dom';

const TemplateDesigner = () => {
    const navigate = useNavigate();

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
                const elementRect = element.getBoundingClientRect();
                offsetX = e.clientX - elementRect.left;
                offsetY = e.clientY - elementRect.top;
                element.style.cursor = "grabbing";
                schedulePreview();
            });

            document.addEventListener("mousemove", (e) => {
                if (isDragging) {
                    const canvasRect = canvasContainer.getBoundingClientRect();
                    const elementWidth = element.offsetWidth;
                    const elementHeight = element.offsetHeight;

                    let newX = e.clientX - canvasRect.left - offsetX;
                    let newY = e.clientY - canvasRect.top - offsetY;

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
            const canvasRect = canvasContainer.getBoundingClientRect();
            const targetWidth = 360;
            const targetHeight = 240;
            const visualWidth = canvasRect.width;
            const visualHeight = canvasRect.height;

            const scaleX = visualWidth / targetWidth;
            const scaleY = visualHeight / targetHeight;


            const element = document.createElement("div");
            element.className = `element ${data.type}`;
            element.style.left = `${data.x * scaleX}px`;
            element.style.top = `${data.y * scaleY}px`;
            element.style.width = `${data.width * scaleX}px`;
            element.style.height = `${data.height * scaleY}px`;
            element.style.color = data.color || "black";
            element.style.backgroundColor = data.fill_color || "transparent";
            element.style.transform = `rotate(${data.rotation || 0}deg)`;
            element.style.justifyContent = data.horizontal_alignment || "center";
            element.style.alignItems = data.vertical_alignment || "center";

            if (["text", "barcode", "qrcode"].includes(data.type)) {
                element.contentEditable = "true";
                element.innerText = data.text || "";
                if (data.font_size) {
                    element.style.fontSize = `${data.font_size * scaleX}px`;
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
            schedulePreview();
        }


        const handleGenerateButtonClick = (event) => {
            event.preventDefault();

            const canvasRect = canvasContainer.getBoundingClientRect();
            const targetWidth = 360;
            const targetHeight = 240;
            const visualWidth = canvasRect.width;
            const visualHeight = canvasRect.height;
            const scaleX = targetWidth / visualWidth;
            const scaleY = targetHeight / visualHeight;

            const elements = [...document.getElementsByClassName("element")].map(
                (element) => {
                    const rect = element.getBoundingClientRect();
                    const visualX = rect.left - canvasRect.left - 1;
                    const visualY = rect.top - canvasRect.top;
                    const elementVisualWidth = rect.width;
                    const elementVisualHeight = rect.height;
                    const visualFontSize = parseInt(getComputedStyle(element).fontSize);

                    return {
                        type: element.classList.contains("text")
                            ? "text"
                            : element.classList.contains("barcode")
                                ? "barcode"
                                : element.classList.contains("qrcode")
                                    ? "qrcode"
                                    : "rectangle",
                        x: Math.round(visualX * scaleX),
                        y: Math.round(visualY * scaleY),
                        width: Math.round(elementVisualWidth * scaleX),
                        height: Math.round(elementVisualHeight * scaleY),
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
                            ? Math.round(visualFontSize * scaleX)
                            : null,
                    };
                }
            );

            api.post("/screen/add_screen_template", {
                template_name: templateNameInput.value,
                elements,
            })
                .then(response => {
                    console.log("Saved template:", response.data);
                    navigate("/manage-shelves-screens");
                })
                .catch(error => {
                    console.error("Save error:", error.response?.data || error);
                });
        };

        generateButton.addEventListener("click", handleGenerateButtonClick);


        const handleDeleteElement = () => {
            if (selectedElement) {
                canvasContainer.removeChild(selectedElement);
                selectedElement = null;
                contextMenu.style.display = "none";
            }
            schedulePreview();
        };
        const deleteElementBtn = document.getElementById("delete-element");
        if (deleteElementBtn) deleteElementBtn.addEventListener("click", handleDeleteElement);

        const handleRotateElement = () => {
            if (selectedElement) {
                const rotation = prompt("Enter rotation angle (degrees):", "0");
                if (rotation)
                    selectedElement.style.transform = `rotate(${rotation}deg)`;
                contextMenu.style.display = "none";
            }
            schedulePreview();
        };
        const rotateElementBtn = document.getElementById("rotate-element");
        if (rotateElementBtn) rotateElementBtn.addEventListener("click", handleRotateElement);

        const handleAlignLeft = () => {
            if (selectedElement) selectedElement.style.justifyContent = "flex-start";
            contextMenu.style.display = "none";
            schedulePreview();
        };
        const alignLeftBtn = document.getElementById("align-left");
        if (alignLeftBtn) alignLeftBtn.addEventListener("click", handleAlignLeft);

        const handleAlignCenter = () => {
            if (selectedElement) selectedElement.style.justifyContent = "center";
            contextMenu.style.display = "none";
            schedulePreview();
        };
        const alignCenterBtn = document.getElementById("align-center");
        if (alignCenterBtn) alignCenterBtn.addEventListener("click", handleAlignCenter);

        const handleAlignRight = () => {
            if (selectedElement) selectedElement.style.justifyContent = "flex-end";
            contextMenu.style.display = "none";
            schedulePreview();
        };
        const alignRightBtn = document.getElementById("align-right");
        if (alignRightBtn) alignRightBtn.addEventListener("click", handleAlignRight);

        const handleAlignTop = () => {
            if (selectedElement) selectedElement.style.alignItems = "flex-start";
            contextMenu.style.display = "none";
            schedulePreview();
        };
        const alignTopBtn = document.getElementById("align-top");
        if (alignTopBtn) alignTopBtn.addEventListener("click", handleAlignTop);

        const handleAlignMiddle = () => {
            if (selectedElement) selectedElement.style.alignItems = "center";
            contextMenu.style.display = "none";
            schedulePreview();
        };
        const alignMiddleBtn = document.getElementById("align-middle");
        if (alignMiddleBtn) alignMiddleBtn.addEventListener("click", handleAlignMiddle);

        const handleAlignBottom = () => {
            if (selectedElement) selectedElement.style.alignItems = "flex-end";
            contextMenu.style.display = "none";
            schedulePreview();
        };
        const alignBottomBtn = document.getElementById("align-bottom");
        if (alignBottomBtn) alignBottomBtn.addEventListener("click", handleAlignBottom);

        const handleTextColorClick = (event) => {
            if (selectedElement)
                selectedElement.style.color = event.currentTarget.style.backgroundColor;
            contextMenu.style.display = "none";
            schedulePreview();
        };
        const colorPickerButtons = document.querySelectorAll("#color-picker-container button");
        colorPickerButtons.forEach((button) => {
            button.addEventListener("click", handleTextColorClick);
        });

        const handleFillColorClick = (event) => {
            if (selectedElement)
                selectedElement.style.backgroundColor = event.currentTarget.style.backgroundColor;
            contextMenu.style.display = "none";
            schedulePreview();
        };
        const fillPickerButtons = document.querySelectorAll("#fill-picker-container button");
        fillPickerButtons.forEach((button) => {
            button.addEventListener("click", handleFillColorClick);
        });

        const handleFontSize = () => {
            if (selectedElement) {
                const fontSize = prompt("Enter font size (px):", "16");
                if (fontSize) selectedElement.style.fontSize = `${fontSize}px`;
                contextMenu.style.display = "none";
            }
            schedulePreview();
        };
        const fontSizeBtn = document.getElementById("font-size");
        if (fontSizeBtn) fontSizeBtn.addEventListener("click", handleFontSize);

        const handleDocumentClick = () => {
            if (contextMenu) { 
                contextMenu.style.display = "none";
            }
        };
        document.addEventListener("click", handleDocumentClick);


        function copyToClipboard(text) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
            } catch (err) {
                console.error("Failed to copy: ", err);
            }
            document.body.removeChild(textArea);
        }

        const handleDynamicContentCopy = (event) => {
            const txt = event.currentTarget.previousElementSibling.innerText;
            copyToClipboard(txt);
        };
        const dynamicContentButtons = document.querySelectorAll("#dynamic-content button");
        dynamicContentButtons.forEach((btn) => {
            btn.addEventListener("click", handleDynamicContentCopy);
        });


        function collectElements() {
            const canvasRect = canvasContainer.getBoundingClientRect();
            const targetWidth = 360;
            const targetHeight = 240;
            const visualWidth = canvasRect.width;
            const visualHeight = canvasRect.height;
            const scaleX = targetWidth / visualWidth;
            const scaleY = targetHeight / visualHeight;

            return [...document.getElementsByClassName("element")].map((el) => {
                const rect = el.getBoundingClientRect();
                const crect = canvasContainer.getBoundingClientRect();

                const visualX = rect.left - crect.left - 1;
                const visualY = rect.top - crect.top;
                const elementVisualWidth = rect.width;
                const elementVisualHeight = rect.height;
                const visualFontSize = parseInt(getComputedStyle(el).fontSize);

                return {
                    type: el.classList.contains("text")
                        ? "text"
                        : el.classList.contains("barcode")
                            ? "barcode"
                            : el.classList.contains("qrcode")
                                ? "qrcode"
                                : "rectangle",
                    x: Math.round(visualX * scaleX),
                    y: Math.round(visualY * scaleY),
                    width: Math.round(elementVisualWidth * scaleX),
                    height: Math.round(elementVisualHeight * scaleY),
                    text: el.innerText,
                    color: el.style.color || "black",
                    fill_color: el.style.backgroundColor || "transparent",
                    rotation: parseInt(el.style.transform.replace(/[^0-9-]/g, "")) || 0,
                    horizontal_alignment: el.style.justifyContent || "center",
                    vertical_alignment: el.style.alignItems || "center",
                    font_size: el.classList.contains("text")
                        ? Math.round(visualFontSize * scaleX)
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

        const handleAddText = () => createElement("text");
        if (addTextButton) addTextButton.addEventListener("click", handleAddText);

        const handleAddBarcode = () => createElement("barcode");
        if (addBarcodeButton) addBarcodeButton.addEventListener("click", handleAddBarcode);

        const handleAddQrCode = () => createElement("qrcode");
        if (addQrCodeButton) addQrCodeButton.addEventListener("click", handleAddQrCode);

        if (loadTemplateBtn) loadTemplateBtn.addEventListener("click", loadSelectedTemplate);


        loadTemplatesList();

        return () => {
            if (generateButton) generateButton.removeEventListener("click", handleGenerateButtonClick);
            if (deleteElementBtn) deleteElementBtn.removeEventListener("click", handleDeleteElement);
            if (rotateElementBtn) rotateElementBtn.removeEventListener("click", handleRotateElement);
            if (alignLeftBtn) alignLeftBtn.removeEventListener("click", handleAlignLeft);
            if (alignCenterBtn) alignCenterBtn.removeEventListener("click", handleAlignCenter);
            if (alignRightBtn) alignRightBtn.removeEventListener("click", handleAlignRight);
            if (alignTopBtn) alignTopBtn.removeEventListener("click", handleAlignTop);
            if (alignMiddleBtn) alignMiddleBtn.removeEventListener("click", handleAlignMiddle);
            if (alignBottomBtn) alignBottomBtn.removeEventListener("click", handleAlignBottom);
            
            colorPickerButtons.forEach((button) => {
                if (button) button.removeEventListener("click", handleTextColorClick);
            });
            fillPickerButtons.forEach((button) => {
                if (button) button.removeEventListener("click", handleFillColorClick);
            });
            
            if (fontSizeBtn) fontSizeBtn.removeEventListener("click", handleFontSize);
            document.removeEventListener("click", handleDocumentClick); 
            
            dynamicContentButtons.forEach((btn) => {
                if (btn) btn.removeEventListener("click", handleDynamicContentCopy);
            });

            if (addTextButton) addTextButton.removeEventListener("click", handleAddText);
            if (addBarcodeButton) addBarcodeButton.removeEventListener("click", handleAddBarcode);
            if (addQrCodeButton) addQrCodeButton.removeEventListener("click", handleAddQrCode);
            if (loadTemplateBtn) loadTemplateBtn.removeEventListener("click", loadSelectedTemplate);
        };
    }, [navigate]);

    return (
        <div>
            <BootstrapNavbar />

            <header className="manage-header mb-3">
                <h1 className="borderh1">Screen Template Designer</h1>
            </header>

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

            <main className="designer-main-content">
                <div className="designer-left-column">
                    <div id="preview-container" className="justify-content-center align-items-center mb-3 mt-3 d-flex flex-column">
                        <div>
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
                            <div class="section-title">You can use one of these to have dynamic content</div>
                            <div class="grid-container">
                                <div class="item-container">
                                    <div class="item-title"><span>Product Name</span></div>
                                    <div class="item">
                                        <span>dynamic:ProductName</span>
                                        <button>Copy</button>
                                    </div>
                                </div>
                                <div class="item-container">
                                    <div class="item-title"><span>Category</span></div>
                                    <div class="item">
                                        <span>dynamic:CategoryName</span>
                                        <button>Copy</button>
                                    </div>
                                </div>
                                <div class="item-container">
                                    <div class="item-title"><span>Price without promotion</span></div>
                                    <div class="item">
                                        <span>dynamic:Price</span>
                                        <button>Copy</button>
                                    </div>
                                </div>
                                <div class="item-container">
                                    <div class="item-title"><span>Promotion Percentage</span></div>
                                    <div class="item">
                                        <span>dynamic:Discount</span>
                                        <button>Copy</button>
                                    </div>
                                </div>
                                <div class="item-container">
                                    <div class="item-title"><span>Final price</span></div>
                                    <div class="item">
                                        <span>dynamic:FinalPrice</span>
                                        <button>Copy</button>
                                    </div>
                                </div>
                                <div class="item-container">
                                    <div class="item-title"><span>Barcode Dynamic (ProductID)</span></div>
                                    <div class="item">
                                        <span>dynamic:ProductID</span>
                                        <button>Copy</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="designer-right-column">
                    <div id="canvas-container">
                        <div id="canvas"></div>
                    </div>
                </div>
            </main>


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
            <Footer />

        </div>
        
    );
};

export default TemplateDesigner;