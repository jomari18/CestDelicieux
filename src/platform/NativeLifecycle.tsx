import { useEffect, useState } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useLocation, useNavigate } from "react-router-dom";
import { handleBack } from "./back";
import { Dialog } from "../components/Dialog";
import { Button } from "../components/Button";
export function NativeLifecycle() {
  const navigate = useNavigate(),
    location = useLocation(),
    [offline, setOffline] = useState(!navigator.onLine),
    [exit, setExit] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("offline", update);
    window.addEventListener("online", update);
    return () => {
      window.removeEventListener("offline", update);
      window.removeEventListener("online", update);
    };
  }, []);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = App.addListener("backButton", () => {
      const modal = document.querySelector<HTMLDialogElement>("dialog[open]");
      handleBack(
        { modalOpen: !!modal, canGoBack: location.pathname !== "/" },
        {
          closeModal: () =>
            modal?.dispatchEvent(new Event("cancel", { cancelable: true })),
          goBack: () => {
            if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
            else navigate("/");
          },
          confirmExit: () => setExit(true),
        },
      );
    });
    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [location.pathname, navigate]);
  return (
    <>
      {offline && (
        <div className="offline-banner" role="status">
          You’re offline. Your order stays saved; reconnect before submitting.
        </div>
      )}
      <Dialog
        open={exit}
        title="Leave C’est Délicieux?"
        onClose={() => setExit(false)}
      >
        <p>Your cart will be here when you return.</p>
        <div className="dialog-actions">
          <Button onClick={() => void App.exitApp()}>Exit app</Button>
          <Button variant="outline" onClick={() => setExit(false)}>
            Stay here
          </Button>
        </div>
      </Dialog>
    </>
  );
}
