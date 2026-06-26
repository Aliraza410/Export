"use client";

import React, { useState, useRef } from "react";
import { buttonVariants } from "./button";
import { Label } from "./label";
import { Switch } from "./switch";
import { useMediaQuery } from "../../hooks/use-media-query";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";
import Badge from "../Badge.jsx";
import { Link } from "react-router-dom";

export function Pricing({
  plans,
  title = "Simple, transparent pricing",
  description = "Everything you need to export successfully, priced for businesses of all sizes.",
}) {
  const [isMonthly, setIsMonthly] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const switchRef = useRef(null);

  const handleToggle = (checked) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: [
          "#1E6FD9",
          "#0EA5E9",
          "#10B981",
          "#F59E0B",
        ],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  return (
    <div className="container mx-auto px-6 lg:px-8 py-20 max-w-7xl" id="pricing">
      <div className="text-center space-y-4 mb-12">
        <div className="flex justify-center mb-4">
          <Badge color="purple">Pricing</Badge>
        </div>
        <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, color: "#0A1628", margin: "16px 0 12px", letterSpacing: "-0.02em", fontFamily: "system-ui, -apple-system, sans-serif" }}>
          {title}
        </h2>
        <p style={{ fontSize: 16, color: "#64748B", maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
          {description}
        </p>
      </div>

      <div className="flex justify-center mb-16 items-center">
        <label className="relative inline-flex items-center cursor-pointer mr-2">
          <Label>
            <Switch
              ref={switchRef}
              checked={!isMonthly}
              onCheckedChange={handleToggle}
              className="relative"
            />
          </Label>
        </label>
        <span className="ml-2 font-semibold text-slate-700">
          Annual billing <span className="text-blue-600">(Save 20%)</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center lg:px-12">
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ y: 50, opacity: 1 }}
            whileInView={
              isDesktop
                ? {
                    y: plan.isPopular ? -20 : 0,
                    opacity: 1,
                    x: index === 2 ? -30 : index === 0 ? 30 : 0,
                    scale: index === 0 || index === 2 ? 0.94 : 1.0,
                  }
                : {}
            }
            viewport={{ once: true, amount: 0.2, margin: "0px 0px -100px 0px" }}
            transition={{
              duration: 1.6,
              type: "spring",
              stiffness: 100,
              damping: 30,
              delay: 0.1,
              opacity: { duration: 0.5 },
            }}
            className={cn(
              `rounded-2xl border-[1px] p-8 bg-white text-center lg:flex lg:flex-col lg:justify-center relative shadow-sm`,
              plan.isPopular ? "border-blue-600 border-2 shadow-xl" : "border-slate-200",
              "flex flex-col",
              !plan.isPopular && "mt-5",
              index === 0 || index === 2
                ? "z-0 transform translate-x-0 translate-y-0 -translate-z-[50px] rotate-y-[10deg]"
                : "z-10",
              index === 0 && "origin-right",
              index === 2 && "origin-left"
            )}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 py-1 px-4 rounded-full flex items-center">
                <Star className="text-white h-3 w-3 fill-current" />
                <span className="text-white ml-1.5 text-xs font-bold uppercase tracking-wider">
                  Popular
                </span>
              </div>
            )}
            <div className="flex-1 flex flex-col items-center">
              <h3 className="text-xl font-bold mb-2 text-slate-900">
                {plan.name}
              </h3>
              
              <div className="mt-4 flex items-baseline justify-center gap-x-2">
                {plan.isCustom ? (
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                    Custom
                  </span>
                ) : (
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                    <NumberFlow
                      value={isMonthly ? Number(plan.price) : Number(plan.yearlyPrice)}
                      format={{
                        style: "currency",
                        currency: "PKR",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }}
                      formatter={(value) => value === 0 ? "Free" : `Rs ${value.toLocaleString()}`}
                      transformTiming={{
                        duration: 500,
                        easing: "ease-out",
                      }}
                      willChange
                      className="font-variant-numeric: tabular-nums"
                    />
                  </span>
                )}
                {!plan.isCustom && plan.price !== "0" && (
                  <span className="text-sm font-semibold leading-6 text-slate-500">
                    / {isMonthly ? "mo" : "mo"}
                  </span>
                )}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-500">
                {plan.description}
              </p>
              
              <Link
                to={plan.href}
                className={cn(
                  buttonVariants({
                    variant: plan.isPopular ? "default" : "outline",
                  }),
                  "mt-8 w-full font-semibold transition-all duration-300",
                  plan.isPopular 
                    ? "bg-blue-600 text-white hover:bg-blue-500" 
                    : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"
                )}
              >
                {plan.buttonText}
              </Link>

              <ul className="mt-8 gap-4 flex flex-col w-full text-left">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="h-5 w-5 flex-shrink-0 text-blue-600" />
                    <span className="text-sm leading-6 text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
