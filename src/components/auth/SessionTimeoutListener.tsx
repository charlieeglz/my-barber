"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos en milisegundos

export function SessionTimeoutListener() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAuthenticatedRef = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;

    // Función para limpiar el temporizador existente y establecer uno nuevo
    const resetTimer = () => {
      if (!isAuthenticatedRef.current) return;

      clearTimer();

      timerRef.current = setTimeout(async () => {
        if (isAuthenticatedRef.current) {
          console.log("[SessionTimeout] Logging out due to inactivity");
          await supabase.auth.signOut();
          router.push("/login?inactive=true");
          router.refresh();
        }
      }, INACTIVITY_TIMEOUT);
    };

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    // Verificar si el usuario está autenticado al inicio
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        isAuthenticatedRef.current = !!session;
        if (session) {
          resetTimer();
        }
      }
    };

    checkInitialSession();

    // Escuchar cambios de estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      isAuthenticatedRef.current = !!session;
      if (session) {
        resetTimer();
      } else {
        clearTimer();
      }
    });

    // Manejar eventos de actividad del usuario
    const handleActivity = () => {
      resetTimer();
    };

    // Eventos a escuchar para detectar actividad
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click"
    ];

    // Registrar los escuchas de eventos
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      mounted = false;
      clearTimer();
      subscription.unsubscribe();
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [router]);

  return null; // Este componente no renderiza nada visualmente
}
