// @ts-check
import { useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { ImageIcon, Home } from "lucide-react";
import Quagga from "@ericblade/quagga2";

export const ScanPage = () => {
  const navigate = useNavigate();

  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: containerRef.current,
          constraints: { facingMode: "environment" },
        },
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "code_128_reader",
            "code_39_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader",
          ],
        },
        locate: true,
        frequency: 10,
      },
      (err) => {
        if (err) {
          console.error("Quagga init failed:", err);
          return;
        }
        Quagga.start();

        setTimeout(() => {
          if (!containerRef.current) return;

          // @ts-ignore
          const els = containerRef.current.querySelectorAll("video, canvas");
          els.forEach((el) => {
            Object.assign(el.style, {
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              height: "100%",
              objectFit: el.tagName.toLowerCase() === "video" ? "cover" : "",
            });
          });
        }, 100);
      }
    );

    Quagga.onDetected(({ codeResult }) => {
      if (codeResult?.code) {
        Quagga.stop();
        navigate(`/product/${codeResult.code}`);
      }
    });

    return () => {
      Quagga.stop();
      Quagga.offDetected();
    };
  }, [navigate]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Quagga.decodeSingle(
      {
        src: URL.createObjectURL(file),
        numOfWorkers: 0,
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "code_128_reader",
            "code_39_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader",
          ],
        },
      },
      (result) => {
        const code = result?.codeResult?.code;
        if (code) {
          navigate(`/product/${code}`);
        }
      }
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100dvw",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      <div
        className="position-absolute bottom-0 start-0 w-100 d-flex justify-content-around pb-4"
        style={{ pointerEvents: "none", zIndex: 1000 }}
      >
        <button
          className="btn btn-light rounded-circle p-3 shadow me-3"
          style={{ pointerEvents: "auto" }}
          onClick={() => navigate("/")}
        >
          <Home size={24} />
        </button>

        <div />

        <button
          className="btn btn-light rounded-circle p-3 shadow ms-3"
          style={{ pointerEvents: "auto" }}
          // @ts-ignore
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon size={24} />
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFile}
        />
      </div>
    </div>
  );
};
