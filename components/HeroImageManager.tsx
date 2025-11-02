import React, { useState, useEffect } from 'react';
import { TrashIcon, PencilIcon, EyeIcon, EyeSlashIcon, CheckIcon, XMarkIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { useTranslation } from '../contexts/LanguageContext';
import {
  getHeroImages,
  addHeroImage,
  updateHeroImage,
  deleteHeroImage,
  updateHeroImagesOrder,
  type HeroImage
} from '../services/supabaseExtendedService';

const HeroImageManager: React.FC = () => {
  const { t } = useTranslation();
  const [images, setImages] = useState<HeroImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageTitle, setNewImageTitle] = useState('');
  const [editingImage, setEditingImage] = useState<HeroImage | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setIsLoading(true);
    try {
      const data = await getHeroImages(false);
      setImages(data);
    } catch (error) {
      console.error('Error loading images:', error);
      showMessage('error', t('admin.heroImages.errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleAddImage = async () => {
    if (!newImageUrl.trim() || !newImageTitle.trim()) {
      showMessage('error', t('admin.heroImages.errors.emptyFields'));
      return;
    }

    try {
      const maxOrder = images.reduce((max, img) => Math.max(max, img.display_order), 0);
      await addHeroImage(newImageUrl, newImageTitle, true, maxOrder + 1, 'admin');
      setNewImageUrl('');
      setNewImageTitle('');
      setIsAdding(false);
      await loadImages();
      showMessage('success', t('admin.heroImages.success.added'));
    } catch (error) {
      console.error('Error adding image:', error);
      showMessage('error', t('admin.heroImages.errors.addFailed'));
    }
  };

  const handleToggleActive = async (image: HeroImage) => {
    try {
      await updateHeroImage(image.id, { is_active: !image.is_active });
      await loadImages();
      showMessage('success', t('admin.heroImages.success.updated'));
    } catch (error) {
      console.error('Error toggling image:', error);
      showMessage('error', t('admin.heroImages.errors.updateFailed'));
    }
  };

  const handleSaveEdit = async () => {
    if (!editingImage) return;

    try {
      await updateHeroImage(editingImage.id, {
        url: editingImage.url,
        title: editingImage.title
      });
      setEditingImage(null);
      await loadImages();
      showMessage('success', t('admin.heroImages.success.updated'));
    } catch (error) {
      console.error('Error updating image:', error);
      showMessage('error', t('admin.heroImages.errors.updateFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('admin.heroImages.confirmDelete'))) return;

    try {
      await deleteHeroImage(id);
      await loadImages();
      showMessage('success', t('admin.heroImages.success.deleted'));
    } catch (error) {
      console.error('Error deleting image:', error);
      showMessage('error', t('admin.heroImages.errors.deleteFailed'));
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newImages = [...images];
    [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];

    try {
      await updateHeroImagesOrder(newImages.map(img => img.id));
      await loadImages();
      showMessage('success', t('admin.heroImages.success.reordered'));
    } catch (error) {
      console.error('Error reordering images:', error);
      showMessage('error', t('admin.heroImages.errors.reorderFailed'));
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === images.length - 1) return;

    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];

    try {
      await updateHeroImagesOrder(newImages.map(img => img.id));
      await loadImages();
      showMessage('success', t('admin.heroImages.success.reordered'));
    } catch (error) {
      console.error('Error reordering images:', error);
      showMessage('error', t('admin.heroImages.errors.reorderFailed'));
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-slate-600">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('admin.heroImages.title')}</h2>
          <p className="text-sm text-slate-600">{t('admin.heroImages.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
        >
          {isAdding ? <XMarkIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
          {isAdding ? t('common.cancel') : t('admin.heroImages.addNew')}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {isAdding && (
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4">{t('admin.heroImages.newImage')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t('admin.heroImages.fields.url')}</label>
              <input
                type="url"
                value={newImageUrl}
                onChange={e => setNewImageUrl(e.target.value)}
                placeholder="https://i.ibb.co/..."
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t('admin.heroImages.fields.title')}</label>
              <input
                type="text"
                value={newImageTitle}
                onChange={e => setNewImageTitle(e.target.value)}
                placeholder={t('admin.heroImages.fields.titlePlaceholder')}
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {newImageUrl && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('admin.heroImages.preview')}</label>
                <img src={newImageUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg" onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="gray">Error</text></svg>';
                }} />
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleAddImage}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
              >
                {t('common.save')}
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewImageUrl('');
                  setNewImageTitle('');
                }}
                className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-slate-50 rounded-lg">
            <p className="text-slate-600">{t('admin.heroImages.noImages')}</p>
          </div>
        ) : (
          images.map((image, index) => (
            <div key={image.id} className={`bg-white rounded-lg shadow-md overflow-hidden border-2 ${image.is_active ? 'border-emerald-500' : 'border-slate-200'}`}>
              {editingImage?.id === image.id ? (
                <div className="p-4 space-y-3">
                  <input
                    type="url"
                    value={editingImage.url}
                    onChange={e => setEditingImage({...editingImage, url: e.target.value})}
                    className="w-full border border-slate-300 rounded p-2 text-sm"
                  />
                  <input
                    type="text"
                    value={editingImage.title}
                    onChange={e => setEditingImage({...editingImage, title: e.target.value})}
                    className="w-full border border-slate-300 rounded p-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit} className="flex-1 bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 flex items-center justify-center gap-2">
                      <CheckIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingImage(null)} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded hover:bg-slate-300 flex items-center justify-center gap-2">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <img src={image.url} alt={image.title} className="w-full h-48 object-cover" />
                    {!image.is_active && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold">{t('admin.heroImages.inactive')}</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <span className="bg-black/70 text-white px-2 py-1 rounded text-xs">#{image.display_order}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-800 mb-2 truncate">{image.title}</h3>
                    <p className="text-xs text-slate-500 mb-3 truncate">{image.url}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleToggleActive(image)}
                        className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded text-sm ${image.is_active ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                      >
                        {image.is_active ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        {image.is_active ? t('admin.heroImages.deactivate') : t('admin.heroImages.activate')}
                      </button>
                      <button onClick={() => setEditingImage(image)} className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleMoveUp(index)} disabled={index === 0} className="p-2 bg-slate-600 text-white rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        <ArrowUpIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleMoveDown(index)} disabled={index === images.length - 1} className="p-2 bg-slate-600 text-white rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        <ArrowDownIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(image.id)} className="p-2 bg-red-600 text-white rounded hover:bg-red-700">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HeroImageManager;
