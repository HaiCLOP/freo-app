"use client";

import React from "react";
import { motion } from "framer-motion";

interface ContentCardProps {
  title: string;
  description: string;
  ctaText?: string;
  isAction?: boolean;
  delay?: number;
}

export function ContentCard({ title, description, ctaText, isAction, delay = 0 }: ContentCardProps) {
  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      className="content-card bg-white rounded-[50px] p-[30px] md:p-[40px] flex flex-col items-start w-full subtle-shadow"
    >
      <h3 className="font-inter font-medium text-[30px] leading-[1.2] text-[#2c2e2a] mb-[20px]">
        {title}
      </h3>
      <p className="font-inter font-normal text-[17px] leading-[1.5] text-[#80827f] mb-[40px] max-w-[400px]">
        {description}
      </p>
      
      {ctaText && (
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-6 py-3 rounded-[50px] font-inter font-medium text-[15px] flex items-center gap-2 ${
            isAction 
              ? "bg-[#ff705d] text-white" 
              : "bg-white border border-[#2c2e2a]/10 text-[#2c2e2a]"
          }`}
        >
          {ctaText}
          <div className={`w-2 h-2 rounded-full ml-1 ${isAction ? "bg-white" : "bg-[#8ed462]"}`} />
        </motion.button>
      )}
    </motion.div>
  );
}
