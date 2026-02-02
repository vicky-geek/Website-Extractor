'use client';

import { useState, useEffect, useMemo } from 'react';
import { ExtractedData } from '@/lib/scraper';
import Image from 'next/image';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import JSZip from 'jszip';

interface ImageWithMetadata {
  src: string;
  alt: string;
  type: string;
  width?: number;
  height?: number;
  size?: number;
  name: string;
}

interface ImageExtractorProps {
  data: ExtractedData;
}

export default function ImageExtractor({ data }: ImageExtractorProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [invertBackground, setInvertBackground] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [keepOrder, setKeepOrder] = useState<string>('none');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [imageMetadata, setImageMetadata] = useState<Map<number, { width: number; height: number; size: number }>>(new Map());
  const imagesPerPage = 24;

  // Process images and extract metadata
  const processedImages = useMemo((): ImageWithMetadata[] => {
    return data.images.map((image, index) => {
      const url = image.src;
      const extension = url.split('.').pop()?.toLowerCase() || '';
      const type = extension === 'jpg' || extension === 'jpeg' ? 'JPEG' : extension.toUpperCase();
      const name = url.split('/').pop() || `image-${index + 1}`;

      return {
        src: url,
        alt: image.alt,
        type,
        name,
        width: imageMetadata.get(index)?.width,
        height: imageMetadata.get(index)?.height,
        size: imageMetadata.get(index)?.size,
      };
    });
  }, [data.images, imageMetadata]);

  // Get unique image types with counts
  const imageTypes = useMemo(() => {
    const typeCounts = new Map<string, number>();
    processedImages.forEach(img => {
      const count = typeCounts.get(img.type) || 0;
      typeCounts.set(img.type, count + 1);
    });
    return Array.from(typeCounts.entries()).map(([type, count]) => ({ type, count }));
  }, [processedImages]);

  // Filter images
  const filteredImages = useMemo(() => {
    let filtered = processedImages;

    // Filter by type
    if (selectedTypes.size > 0) {
      filtered = filtered.filter(img => selectedTypes.has(img.type));
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(img =>
        img.src.toLowerCase().includes(query) ||
        img.name.toLowerCase().includes(query) ||
        img.type.toLowerCase().includes(query) ||
        (img.width && img.width.toString().includes(query)) ||
        (img.height && img.height.toString().includes(query))
      );
    }

    // Sort images
    if (sortBy !== 'all') {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'image-size':
            const aImageSize = (a.width || 0) * (a.height || 0);
            const bImageSize = (b.width || 0) * (b.height || 0);
            comparison = aImageSize - bImageSize;
            break;
          case 'file-size':
            comparison = (a.size || 0) - (b.size || 0);
            break;
          case 'width':
            comparison = (a.width || 0) - (b.width || 0);
            break;
          case 'height':
            comparison = (a.height || 0) - (b.height || 0);
            break;
          case 'type':
            comparison = a.type.localeCompare(b.type);
            break;
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          default:
            return 0;
        }

        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [processedImages, selectedTypes, searchQuery, sortBy, sortDirection]);

  // Paginate
  const paginatedImages = useMemo(() => {
    const start = (currentPage - 1) * imagesPerPage;
    return filteredImages.slice(start, start + imagesPerPage);
  }, [filteredImages, currentPage]);

  const totalPages = Math.ceil(filteredImages.length / imagesPerPage);

  // Load image metadata
  useEffect(() => {
    if (typeof window === 'undefined') return;

    processedImages.forEach((img, index) => {
      if (!imageMetadata.has(index)) {
        // Fetch image dimensions
        const imgElement = document.createElement('img');
        imgElement.crossOrigin = 'anonymous';
        imgElement.onload = () => {
          setImageMetadata(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(index);
            newMap.set(index, {
              width: imgElement.naturalWidth,
              height: imgElement.naturalHeight,
              size: existing?.size || 0,
            });
            return newMap;
          });
        };
        imgElement.onerror = () => {
          // Silently fail if image can't be loaded
        };
        imgElement.src = img.src;

        // Try to fetch file size from headers
        fetch(img.src, { method: 'HEAD' })
          .then(response => {
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
              setImageMetadata(prev => {
                const newMap = new Map(prev);
                const existing = newMap.get(index);
                newMap.set(index, {
                  width: existing?.width || 0,
                  height: existing?.height || 0,
                  size: parseInt(contentLength, 10),
                });
                return newMap;
              });
            }
          })
          .catch(() => {
            // Silently fail if HEAD request fails (CORS, etc.)
          });
      }
    });
  }, [processedImages, imageMetadata]);

  // Toggle type filter
  const toggleTypeFilter = (type: string) => {
    setSelectedImages(new Set());
    setSelectedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  // Select/deselect all
  const selectAll = () => {
    setSelectedImages(new Set(paginatedImages.map((_, i) => (currentPage - 1) * imagesPerPage + i)));
  };

  const deselectAll = () => {
    setSelectedImages(new Set());
  };

  // Toggle image selection
  const toggleImageSelection = (index: number) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Download selected images
  const downloadSelected = async () => {
    const selected = Array.from(selectedImages).map(i => filteredImages[i]);
    let successCount = 0;
    let failCount = 0;
    const failedImages: string[] = [];

    for (let i = 0; i < selected.length; i++) {
      const img = selected[i];
      try {
        let blob: Blob;

        // Handle data URLs and blob URLs
        if (img.src.startsWith('data:') || img.src.startsWith('blob:')) {
          const response = await fetch(img.src);
          blob = await response.blob();
        } else {
          // Try to fetch the image
          try {
            const response = await fetch(img.src, {
              mode: 'cors',
              credentials: 'omit',
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            blob = await response.blob();
          } catch (fetchError: any) {
            // CORS error or fetch failed
            const isCorsError = fetchError.message?.includes('CORS') ||
                               fetchError.message?.includes('Failed to fetch') ||
                               fetchError.name === 'TypeError';

            if (isCorsError) {
              failedImages.push(img.name);
              failCount++;
              continue;
            }
            throw fetchError;
          }
        }

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.style.display = 'none';

        const prefix = keepOrder !== 'none' ? `${String(i + 1).padStart(3, '0')}_` : '';
        a.download = `${prefix}${img.name}`;

        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);

        successCount++;
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error: any) {
        console.error(`Failed to download ${img.src}:`, error);
        failedImages.push(img.name);
        failCount++;
      }
    }

    // Show summary toast
    if (successCount > 0 && failCount === 0) {
      toast.success(`Successfully downloaded ${successCount} image(s)`, {
        position: 'top-right',
        autoClose: 3000,
      });
    } else if (successCount > 0 && failCount > 0) {
      const failedList = failedImages.length <= 5
        ? failedImages.join(', ')
        : `${failedImages.slice(0, 5).join(', ')} and ${failedImages.length - 5} more`;

      toast.error(
        `Downloaded ${successCount} image(s), ${failCount} failed due to CORS restrictions: ${failedList}. Please right-click on failed images and select "Save image as..." to download.`,
        {
          position: 'top-right',
          autoClose: 8000,
        }
      );
    } else if (failCount > 0) {
      const failedList = failedImages.length <= 5
        ? failedImages.join(', ')
        : `${failedImages.slice(0, 5).join(', ')} and ${failedImages.length - 5} more`;

      toast.error(
        `All ${failCount} image(s) failed to download due to CORS restrictions: ${failedList}. Please right-click on images and select "Save image as..." to download.`,
        {
          position: 'top-right',
          autoClose: 8000,
        }
      );
    }
  };

  // Download all images as ZIP
  const downloadAllAsZip = async () => {
    const imagesToDownload = filteredImages;
    const zip = new JSZip();
    let successCount = 0;
    let failCount = 0;

    toast.info(`Preparing ZIP file with ${imagesToDownload.length} image(s)...`, {
      position: 'top-right',
      autoClose: 2000,
    });

    for (let i = 0; i < imagesToDownload.length; i++) {
      const img = imagesToDownload[i];
      try {
        let blob: Blob;

        // Handle data URLs and blob URLs
        if (img.src.startsWith('data:') || img.src.startsWith('blob:')) {
          const response = await fetch(img.src);
          blob = await response.blob();
        } else {
          // Try to fetch the image
          try {
            const response = await fetch(img.src, {
              mode: 'cors',
              credentials: 'omit',
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            blob = await response.blob();
          } catch (fetchError: any) {
            // CORS error - try canvas method
            try {
              blob = await new Promise<Blob>((resolve, reject) => {
                const image = document.createElement('img');
                image.crossOrigin = 'anonymous';
                let resolved = false;

                const handleSuccess = () => {
                  if (resolved) return;
                  resolved = true;

                  try {
                    const canvas = document.createElement('canvas');
                    canvas.width = image.naturalWidth;
                    canvas.height = image.naturalHeight;
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                      reject(new Error('Could not get canvas context'));
                      return;
                    }

                    ctx.drawImage(image, 0, 0);

                    canvas.toBlob((blob) => {
                      if (blob) {
                        resolve(blob);
                      } else {
                        reject(new Error('Failed to convert canvas to blob'));
                      }
                    }, 'image/png');
                  } catch (error) {
                    reject(error);
                  }
                };

                image.onload = handleSuccess;
                image.onerror = () => {
                  if (resolved) return;
                  resolved = true;
                  reject(new Error('Failed to load image'));
                };

                image.src = img.src;

                setTimeout(() => {
                  if (!resolved && !image.complete) {
                    resolved = true;
                    reject(new Error('Image load timeout'));
                  }
                }, 10000);
              });
            } catch (canvasError) {
              // Both methods failed - skip this image
              failCount++;
              continue;
            }
          }
        }

        // Add to ZIP
        const prefix = keepOrder !== 'none' ? `${String(i + 1).padStart(3, '0')}_` : '';
        const filename = `${prefix}${img.name}`;
        zip.file(filename, blob);
        successCount++;
      } catch (error: any) {
        console.error(`Failed to add ${img.name} to ZIP:`, error);
        failCount++;
      }
    }

    if (successCount === 0) {
      toast.error('Failed to download any images. Please check CORS settings or try downloading individually.', {
        position: 'top-right',
        autoClose: 5000,
      });
      return;
    }

    // Generate and download ZIP
    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `images-${new Date().getTime()}.zip`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      if (failCount > 0) {
        toast.warning(`ZIP created with ${successCount} image(s), ${failCount} failed due to CORS restrictions.`, {
          position: 'top-right',
          autoClose: 5000,
        });
      } else {
        toast.success(`Successfully created ZIP with ${successCount} image(s)`, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } catch (error: any) {
      toast.error('Failed to create ZIP file', {
        position: 'top-right',
        autoClose: 5000,
      });
    }
  };

  // Download single image
  const downloadSingleImage = async (img: ImageWithMetadata, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      let blob: Blob;

      // Handle data URLs and blob URLs
      if (img.src.startsWith('data:') || img.src.startsWith('blob:')) {
        const response = await fetch(img.src);
        blob = await response.blob();
      } else {
        // Try to fetch the image
        try {
          const response = await fetch(img.src, {
            mode: 'cors',
            credentials: 'omit',
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          blob = await response.blob();
        } catch (fetchError: any) {
          // CORS error or fetch failed
          const isCorsError = fetchError.message?.includes('CORS') ||
                             fetchError.message?.includes('Failed to fetch') ||
                             fetchError.name === 'TypeError' ||
                             fetchError.message?.includes('NetworkError');

          if (isCorsError) {
            toast.error(
              `Download failed due to CORS restrictions. Please right-click on the image and select "Save image as..." to download.`,
              {
                position: 'top-right',
                autoClose: 6000,
              }
            );
            return;
          }
          throw fetchError;
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.style.display = 'none';
      a.download = img.name;

      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success(`Downloaded ${img.name}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error: any) {
      console.error(`Failed to download ${img.src}:`, error);
      toast.error(
        `Download failed. Please right-click on the image and select "Save image as..." to download.`,
        {
          position: 'top-right',
          autoClose: 6000,
        }
      );
    }
  };

  // Copy URLs to clipboard
  const copyUrls = async () => {
    const selected = Array.from(selectedImages).map(i => filteredImages[i]);
    const urls = selected.map(img => img.src).join('\n');
    try {
      await navigator.clipboard.writeText(urls);
      toast.success(`Copied ${selected.length} URL(s) to clipboard`, {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error) {
      toast.error('Failed to copy URLs to clipboard', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const selected = Array.from(selectedImages).map(i => filteredImages[i]);
    const csv = [
      ['URL', 'Name', 'Type', 'Width', 'Height', 'Alt Text'].join(','),
      ...selected.map(img => [
        `"${img.src}"`,
        `"${img.name}"`,
        `"${img.type}"`,
        img.width || '',
        img.height || '',
        `"${img.alt || ''}"`
      ].join(','))
    ].join('\n');

    try {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'images.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Exported ${selected.length} image(s) to CSV`, {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error) {
      toast.error('Failed to export CSV', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (data.images.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">No images found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Side Panel */}
      <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
        {/* Sort Images */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort images
            </label>
            {sortBy !== 'all' && (
              <button
                onClick={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={sortDirection === 'desc' ? 'Big -> Small' : 'Small -> Big'}
              >
                {sortDirection === 'desc' ? 'Big -> Small' : 'Small -> Big'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            )}
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">None</option>
              <option value="image-size">Image size</option>
              <option value="file-size">File size</option>
              <option value="width">Width</option>
              <option value="height">Height</option>
              <option value="type">Type</option>
              <option value="name">Name</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Filter by Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filter images by type
          </label>
          <div className="flex flex-wrap gap-2">
            {imageTypes.map(({ type, count }) => (
              <button
                key={type}
                onClick={() => toggleTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedTypes.has(type)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {type} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search for images
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Type to search..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Filter by URL, name, type and width/height.
          </p>
        </div>

        {/* Background Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="invert-bg"
            checked={invertBackground}
            onChange={(e) => setInvertBackground(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <label htmlFor="invert-bg" className="text-sm text-gray-700 dark:text-gray-300">
            Invert image preview background
          </label>
        </div>

        {/* Download Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">DOWNLOAD</h3>
          <div className="flex gap-2 mb-4">
            <button
              onClick={selectAll}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Select all
            </button>
            <button
              onClick={deselectAll}
              className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
            >
              Deselect all
            </button>
          </div>

          {/* Keep Order */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Keep order of images
            </label>
            <select
              value={keepOrder}
              onChange={(e) => setKeepOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="none">None</option>
              <option value="numeric">Numeric prefix</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              When enabled, a numeric prefix will be added to each downloaded file.
            </p>
          </div>

          {/* Download Selected */}
          <button
            onClick={downloadSelected}
            disabled={selectedImages.size === 0}
            className="w-full px-4 py-3 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download selected ({selectedImages.size})
          </button>

          {/* Download All as ZIP */}
          <button
            onClick={downloadAllAsZip}
            disabled={filteredImages.length === 0}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download All as ZIP ({filteredImages.length})
          </button>

          {/* Copy URLs / Export CSV */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={copyUrls}
              disabled={selectedImages.size === 0}
              className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
            >
              Copy URLs
            </button>
            <button
              onClick={exportToCSV}
              disabled={selectedImages.size === 0}
              className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredImages.length} of {data.images.length} images
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Images Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedImages.map((image, index) => {
              const globalIndex = (currentPage - 1) * imagesPerPage + index;
              const isSelected = selectedImages.has(globalIndex);
              return (
                <div
                  key={globalIndex}
                  className={`bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => toggleImageSelection(globalIndex)}
                >
                  <div
                    className={`relative h-48 w-full ${
                      invertBackground
                        ? 'bg-white dark:bg-black'
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt || image.name}
                      fill
                      className="object-contain"
                      unoptimized
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        image.type === 'PNG' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                        image.type === 'JPEG' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                        image.type === 'SVG' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                        'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                      }`}>
                        {image.type}
                      </span>
                      {image.width && image.height && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {image.width} x {image.height} PX
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1" title={image.name}>
                      {image.name}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <a
                        href={image.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View
                      </a>
                      <button
                        onClick={(e) => downloadSingleImage(image, e)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedImages.map((image, index) => {
              const globalIndex = (currentPage - 1) * imagesPerPage + index;
              const isSelected = selectedImages.has(globalIndex);
              return (
                <div
                  key={globalIndex}
                  className={`bg-gray-50 dark:bg-gray-700 rounded-lg border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => toggleImageSelection(globalIndex)}
                >
                  <div className="flex items-center gap-4 p-4">
                    <div
                      className={`relative w-24 h-24 flex-shrink-0 rounded ${
                        invertBackground
                          ? 'bg-white dark:bg-black'
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <Image
                        src={image.src}
                        alt={image.alt || image.name}
                        fill
                        className="object-contain rounded"
                        unoptimized
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          image.type === 'PNG' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                          image.type === 'JPEG' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                          image.type === 'SVG' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                          'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                        }`}>
                          {image.type}
                        </span>
                        {image.width && image.height && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {image.width} x {image.height} PX
                          </span>
                        )}
                        {image.size && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(image.size)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1" title={image.name}>
                        {image.name}
                      </p>
                      <a
                        href={image.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block"
                      >
                        {image.src}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={image.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="View"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <button
                        onClick={(e) => downloadSingleImage(image, e)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Download"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Copyright Disclaimer */}
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
            Copyright Disclaimer
          </h4>
          <p className="text-xs text-yellow-800 dark:text-yellow-300">
            All images displayed are extracted from the website for informational purposes only.
            Images are the property of their respective owners. Please respect copyright laws and
            obtain proper permissions before using any images for commercial purposes.
          </p>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}
