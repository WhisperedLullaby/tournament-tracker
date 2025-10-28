"use client";

import { motion } from "framer-motion";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { GridPattern } from "@/components/ui/grid-pattern";

type ElegantShapeProps = {
  className?: string;
  delay?: number;
  size?: number;
  rotate?: number;
  gradient?: string;
};

function ElegantShape({
  className,
  delay = 0,
  size = 150,
  rotate = 0,
  gradient = "from-primary/[0.08]",
}: ElegantShapeProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -150,
        rotate: rotate - 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: rotate,
      }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{
          y: [0, 15, 0],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{
          width: size,
          height: size,
        }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-linear-to-br to-transparent",
            gradient,
            "border-primary/15 border-2 backdrop-blur-[2px]",
            "shadow-[0_8px_32px_0_rgba(15,69,110,0.1)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(15,69,110,0.2),transparent_70%)]"
          )}
        />
      </motion.div>
    </motion.div>
  );
}

type HeroGeometricProps = {
  badge?: string;
  title1?: string;
  title2?: string;
  description?: string;
  className?: string;
  rightContent?: ReactNode;
};

export function HeroGeometric({
  badge = "Registration Open",
  title1 = "Lorem Ipsum Dolor",
  title2 = "Sit Amet Consectetur",
  description = "Inviting volleyball players of all skill levels to connect, play, and compete!",
  className,
  rightContent,
}: HeroGeometricProps) {
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1] as const,
      },
    }),
  };

  return (
    <div
      className={cn(
        "bg-background relative flex min-h-screen w-full items-center justify-center overflow-hidden",
        className
      )}
    >
      {/* Grid pattern background (volleyball net) */}
      <GridPattern
        width={80}
        height={80}
        x={-1}
        y={-1}
        className={cn("stroke-primary/10 fill-primary/5")}
      />

      {/* Floating volleyball shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.3}
          size={250}
          rotate={12}
          gradient="from-primary/[0.15]"
          className="top-[15%] left-[-10%] md:top-[20%] md:left-[-5%]"
        />
        <ElegantShape
          delay={0.5}
          size={200}
          rotate={-15}
          gradient="from-accent/[0.15]"
          className="top-[70%] right-[-5%] md:top-[75%] md:right-[0%]"
        />
        <ElegantShape
          delay={0.4}
          size={180}
          rotate={-8}
          gradient="from-secondary/[0.15]"
          className="bottom-[5%] left-[5%] md:bottom-[10%] md:left-[10%]"
        />
        <ElegantShape
          delay={0.6}
          size={150}
          rotate={20}
          gradient="from-accent/[0.15]"
          className="top-[10%] right-[15%] md:top-[15%] md:right-[20%]"
        />
        <ElegantShape
          delay={0.7}
          size={120}
          rotate={-25}
          gradient="from-primary/[0.15]"
          className="top-[5%] left-[20%] md:top-[10%] md:left-[25%]"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto grid gap-8 px-4 py-12 md:grid-cols-2 md:gap-12 md:px-6 lg:gap-16">
        {/* Left side - Hero content */}
        <div className="flex flex-col justify-center text-center md:text-left">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="border-primary/20 bg-card/80 mb-8 inline-flex items-center gap-2 rounded-full border px-3 py-1 backdrop-blur-sm md:mb-12"
          >
            <Circle className="fill-accent/80 h-2 w-2" />
            <span className="text-muted-foreground text-sm tracking-wide">
              {badge}
            </span>
          </motion.div>

          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:mb-8 md:text-6xl lg:text-7xl">
              <span className="from-foreground to-foreground/80 bg-linear-to-b bg-clip-text text-transparent lg:text-8xl">
                {title1}
              </span>
              <br />
              <span className="from-primary via-accent to-primary bg-linear-to-r bg-clip-text text-transparent lg:text-6xl">
                {title2}
              </span>
            </h1>
          </motion.div>

          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="text-muted-foreground mx-auto mb-8 max-w-xl px-4 text-base leading-relaxed font-light tracking-wide sm:text-lg md:mx-0 md:px-0 md:text-xl">
              {description}
            </p>
          </motion.div>
        </div>

        {/* Right side - Form or other content */}
        {rightContent && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="flex items-center justify-center"
          >
            {rightContent}
          </motion.div>
        )}
      </div>

      {/* Bottom gradient fade */}
      <div className="from-background to-background/80 pointer-events-none absolute inset-0 bg-linear-to-t via-transparent" />
    </div>
  );
}

export type { HeroGeometricProps, ElegantShapeProps };
