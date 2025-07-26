import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: "blur" | "empty";
  quality?: number;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes = "100vw",
  onLoad,
  onError,
  placeholder = "blur",
  quality = 80,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [currentSrc, setCurrentSrc] = useState<string>("");

  // Generate WebP and fallback URLs
  const generateOptimizedUrl = (originalSrc: string) => {
    // If it's already a Cloudinary URL, optimize it
    if (
      originalSrc.includes("cloudinary.com") ||
      originalSrc.includes("res.cloudinary.com")
    ) {
      const baseUrl = originalSrc.split("/upload/")[0] + "/upload/";
      const imagePath = originalSrc.split("/upload/")[1];

      return {
        webp: `${baseUrl}f_webp,q_${quality}${width ? `,w_${width}` : ""}${height ? `,h_${height}` : ""},c_fill/${imagePath}`,
        jpeg: `${baseUrl}f_auto,q_${quality}${width ? `,w_${width}` : ""}${height ? `,h_${height}` : ""},c_fill/${imagePath}`,
        placeholder: `${baseUrl}f_auto,q_10,w_20,h_20,c_fill,e_blur:1000/${imagePath}`,
      };
    }

    // For other URLs, return as-is (in production, you'd want to use a CDN service)
    return {
      webp: originalSrc,
      jpeg: originalSrc,
      placeholder: originalSrc,
    };
  };

  const { webp, jpeg, placeholder: placeholderSrc } = generateOptimizedUrl(src);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "50px",
      },
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  // Load the appropriate image format
  useEffect(() => {
    if (!isInView) return;

    // Check WebP support
    const canvas = document.createElement("canvas");
    const webpSupported = canvas.toDataURL("image/webp").indexOf("webp") > -1;

    setCurrentSrc(webpSupported ? webp : jpeg);
  }, [isInView, webp, jpeg]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    // Fallback to JPEG if WebP fails
    if (currentSrc === webp) {
      setCurrentSrc(jpeg);
    }
    onError?.();
  };

  return (
    <div
      ref={imgRef}
      className={cn("relative overflow-hidden", className)}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {placeholder === "blur" && !isLoaded && isInView && (
        <img
          src={placeholderSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110 transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Loading skeleton */}
      {!isLoaded && isInView && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
      )}

      {/* Main image */}
      {(isInView || priority) && (
        <img
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
          <div className="text-slate-400 text-sm text-center">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Image unavailable
          </div>
        </div>
      )}
    </div>
  );
}

export default OptimizedImage;
