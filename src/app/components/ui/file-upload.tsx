import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, CheckCircle2, ShieldAlert } from "lucide-react";

interface FileUploadProps {
  onChange?: (files: File[]) => void;
  accept?: string;
  maxSizeMB?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onChange,
  accept = ".pdf,.vtt",
  maxSizeMB = 20,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (incomingFiles: FileList | File[]) => {
    setError(null);
    const validFiles: File[] = [];
    const maxBytes = maxSizeMB * 1024 * 1024;

    Array.from(incomingFiles).forEach((file) => {
      if (file.size > maxBytes) {
        setError(`File "${file.name}" exceeds the ${maxSizeMB}MB size limit.`);
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      const updated = [...files, ...validFiles];
      setFiles(updated);
      if (onChange) onChange(updated);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    if (onChange) onChange(updated);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full space-y-4">
      {/* Drop Zone */}
      <motion.div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 overflow-hidden ${
          isDragActive
            ? "border-emerald-400 bg-emerald-500/10 shadow-[0_0_30px_rgba(52,211,153,0.2)]"
            : "border-white/20 bg-zinc-950/80 hover:border-white/40 hover:bg-zinc-900/60"
        }`}
      >
        {/* Animated Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="relative z-10 space-y-3">
          <motion.div
            animate={{ y: isDragActive ? -4 : 0 }}
            className="mx-auto w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-lg"
          >
            <Upload className="w-6 h-6 text-emerald-400" />
          </motion.div>

          <div className="space-y-1">
            <p className="font-mono text-xs font-bold text-white">
              {isDragActive ? "Drop files to upload" : "Drag & drop files here, or click to browse"}
            </p>
            <p className="font-mono text-[11px] text-zinc-400">
              Supports PDF documents (.pdf) & VTT transcripts (.vtt) up to {maxSizeMB}MB
            </p>
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-rose-400 font-mono text-xs p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Uploaded Files Preview Cards */}
      <AnimatePresence>
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="font-mono text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
              Selected Files ({files.length})
            </div>

            {files.map((file, idx) => (
              <motion.div
                key={file.name + idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-white/15 text-white font-mono text-xs shadow-md"
              >
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{file.name}</div>
                    <div className="text-[10px] text-zinc-400">{formatFileSize(file.size)}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
