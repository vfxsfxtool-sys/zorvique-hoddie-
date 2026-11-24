import { useState } from 'react';
import { HardDrive, Upload, FileText, Image as ImageIcon, Download, Trash2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { StorageFile } from '../types';

interface StorageViewProps {
  files: StorageFile[];
  onUploadFile: (file: StorageFile) => void;
  onDeleteFile: (fileId: string) => void;
}

export function StorageView({ files, onUploadFile, onDeleteFile }: StorageViewProps) {
  const [selectedBucket, setSelectedBucket] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);

  const buckets = ['project-assets', 'documents', 'avatars', 'backups'];

  const filteredFiles = selectedBucket === 'all' 
    ? files 
    : files.filter(f => f.bucket === selectedBucket);

  const handleSimulatedUpload = () => {
    const sampleNames = [
      'database-schema-v3.sql',
      'q3-financial-audit.pdf',
      'tenant-rls-policies.json',
      'hero-banner-preview.png',
    ];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomBucket = buckets[Math.floor(Math.random() * buckets.length)];
    
    const newFile: StorageFile = {
      id: `file_${Date.now()}`,
      name: randomName,
      bucket: randomBucket,
      size: Math.floor(Math.random() * 5000000) + 200000,
      type: randomName.endsWith('.pdf') ? 'application/pdf' : randomName.endsWith('.png') ? 'image/png' : 'application/octet-stream',
      url: randomName.endsWith('.png') ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80' : '#',
      created_at: new Date().toISOString(),
      owner_email: 'alex.dev@supaship.io',
    };

    onUploadFile(newFile);
    setIsUploading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Supabase Storage Buckets</h1>
          <p className="text-xs text-slate-400">Secure object storage with public/private bucket RLS policies</p>
        </div>

        <button
          onClick={() => {
            setIsUploading(true);
            setTimeout(handleSimulatedUpload, 600);
          }}
          disabled={isUploading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          <span>{isUploading ? 'Uploading to Bucket...' : 'Upload File'}</span>
        </button>
      </div>

      {/* Bucket Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setSelectedBucket('all')}
          className={`rounded-xl px-4 py-2 text-xs font-medium transition-all ${
            selectedBucket === 'all'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          All Buckets ({files.length})
        </button>
        {buckets.map((b) => {
          const count = files.filter(f => f.bucket === b).length;
          return (
            <button
              key={b}
              onClick={() => setSelectedBucket(b)}
              className={`rounded-xl px-4 py-2 text-xs font-medium transition-all ${
                selectedBucket === b
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {b} ({count})
            </button>
          );
        })}
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.map((file) => {
          const isImage = file.type.startsWith('image/');
          const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
          return (
            <div
              key={file.id}
              className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-emerald-500/50 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-emerald-400 border border-slate-700">
                    {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white truncate max-w-[180px]" title={file.name}>
                      {file.name}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">{file.bucket}</span>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteFile(file.id)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {isImage && (
                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 h-36">
                  <img src={file.url} alt={file.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <span>{sizeMB} MB</span>
                <span className="text-slate-500">{new Date(file.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFiles.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <HardDrive className="h-10 w-10 text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-white">No files in this bucket</h3>
          <p className="text-xs text-slate-400 mt-1">Upload assets or documents to test Supabase Storage bucket APIs.</p>
        </div>
      )}
    </div>
  );
}
