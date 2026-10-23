"use client";

import { useEffect } from "react";
import { aplicarTemaPhanyx, lerTemaPhanyx } from "@/lib/tema-phanyx";

export default function PhanyxThemeBoot() {
  useEffect(() => { aplicarTemaPhanyx(lerTemaPhanyx()); }, []);
  return null;
}
