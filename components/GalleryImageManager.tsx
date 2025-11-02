import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import {
  getGalleryImages,
  addGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  updateGalleryImagesOrder,
  type GalleryImage
} from '../services/supabaseExtendedService';

const GalleryImageManager: React.FC = () => {
  const { t } = useTranslation();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [showNewImageForm, setShowNewImageForm] = useState(false);
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    alt_text: '',
    caption: '',
    likes: 0,
    comments: 0
  });

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGalleryImages(false);
      setImages(data);
    } catch (err) {
      setError(t('admin.galleryImages.errors.loadFailed') || 'Error al cargar imágenes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async () => {
    if (!formData.url || !formData.title || !formData.alt_text || !formData.caption) {
      setError(t('admin.galleryImages.errors.emptyFields') || 'Completa todos los campos');
      return;
    }

    setError(null);

    try {
      const nextPosition = Math.max(...images.map(img => img.order_position), 0) + 1;
      await addGalleryImage(
        formData.url,
        formData.title,
        formData.alt_text,
        formData.caption,
        formData.likes,
        formData.comments,
        nextPosition,
        true
      );
      setSuccessMessage(t('admin.galleryImages.success.added') || 'Imagen agregada exitosamente');
      setShowNewImageForm(false);
      setFormData({ url: '', title: '', alt_text: '', caption: '', likes: 0, comments: 0 });
      loadImages();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error al agregar imagen:', errorMsg);
      setError(t('admin.galleryImages.errors.addFailed') || 'Error al agregar imagen');
    }
  };

  const handleUpdateImage = async () => {
    if (!editingImage) return;

    if (!formData.url || !formData.title || !formData.alt_text || !formData.caption) {
      setError(t('admin.galleryImages.errors.emptyFields') || 'Completa todos los campos');
      return;
    }

    setError(null);

    try {
      await updateGalleryImage(editingImage.id, {
        url: formData.url,
        title: formData.title,
        alt_text: formData.alt_text,
        caption: formData.caption,
        likes: formData.likes,
        comments: formData.comments
      });
      setSuccessMessage(t('admin.galleryImages.success.updated') || 'Imagen actualizada exitosamente');
      setEditingImage(null);
      setFormData({ url: '', title: '', alt_text: '', caption: '', likes: 0, comments: 0 });
      loadImages();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error al actualizar imagen:', errorMsg);
      setError(t('admin.galleryImages.errors.updateFailed') || 'Error al actualizar imagen');
    }
  };

  const handleToggleActive = async (image: GalleryImage) => {
    setError(null);
    try {
      await updateGalleryImage(image.id, { is_active: !image.is_active });
      setSuccessMessage(t('admin.galleryImages.success.updated') || 'Estado actualizado');
      loadImages();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error al cambiar estado de imagen:', errorMsg);
      setError(t('admin.galleryImages.errors.updateFailed') || 'Error al actualizar');
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm(t('admin.galleryImages.confirmDelete') || '¿Estás seguro de eliminar esta imagen?')) {
      return;
    }

    setError(null);

    try {
      await deleteGalleryImage(id);
      setSuccessMessage(t('admin.galleryImages.success.deleted') || 'Imagen eliminada exitosamente');
      loadImages();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error al eliminar imagen:', errorMsg);
      setError(t('admin.galleryImages.errors.deleteFailed') || 'Error al eliminar imagen');
    }
  };

  const handleMoveImage = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === images.length - 1)
    ) {
      return;
    }

    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];

    setError(null);

    try {
      await updateGalleryImagesOrder(newImages.map(img => img.id));
      setSuccessMessage(t('admin.galleryImages.success.reordered') || 'Orden actualizado');
      loadImages();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error al reordenar imágenes:', errorMsg);
      setError(t('admin.galleryImages.errors.reorderFailed') || 'Error al reordenar');
    }
  };

  const startEdit = (image: GalleryImage) => {
    setEditingImage(image);
    setFormData({
      url: image.url,
      title: image.title,
      alt_text: image.alt_text,
      caption: image.caption,
      likes: image.likes,
      comments: image.comments
    });
    setShowNewImageForm(false);
  };

  const cancelEdit = () => {
    setEditingImage(null);
    setShowNewImageForm(false);
    setFormData({ url: '', title: '', alt_text: '', caption: '', likes: 0, comments: 0 });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-slate-600">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">
            {t('admin.galleryImages.title') || 'Gestión de Imágenes de Galería'}
          </h3>
          <p className="text-slate-600 mt-1">
            {t('admin.galleryImages.subtitle') || 'Administra las imágenes que aparecen en "Sigue nuestra historia"'}
          </p>
        </div>
        {!showNewImageForm && !editingImage && (
          <button
            onClick={() => setShowNewImageForm(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            {t('admin.galleryImages.addNew') || 'Agregar Nueva Imagen'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {(showNewImageForm || editingImage) && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h4 className="text-lg font-semibold mb-4">
            {editingImage ? 'Editar Imagen' : (t('admin.galleryImages.newImage') || 'Nueva Imagen')}
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('admin.galleryImages.fields.url') || 'URL de la Imagen'}
              </label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('admin.galleryImages.fields.title') || 'Título de la Imagen'}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={t('admin.galleryImages.fields.titlePlaceholder') || 'Ej: Sierra Nevada al atardecer'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Texto Alternativo (Alt)
              </label>
              <input
                type="text"
                value={formData.alt_text}
                onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Descripción breve de la imagen"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Caption (Texto al hacer hover)
              </label>
              <textarea
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={3}
                placeholder="Texto que aparece al pasar el mouse sobre la imagen"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Likes
                </label>
                <input
                  type="number"
                  value={formData.likes}
                  onChange={(e) => setFormData({ ...formData, likes: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Comentarios
                </label>
                <input
                  type="number"
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>

            {formData.url && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('admin.galleryImages.preview') || 'Vista Previa'}
                </label>
                <img
                  src={formData.url}
                  alt={formData.alt_text}
                  className="w-full max-w-md h-64 object-cover rounded-lg border border-slate-200"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={editingImage ? handleUpdateImage : handleAddImage}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {t('common.save')}
              </button>
              <button
                onClick={cancelEdit}
                className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {images.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <p className="text-slate-600">{t('admin.galleryImages.noImages') || 'No hay imágenes configuradas'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`bg-white rounded-lg overflow-hidden shadow-sm border ${
                image.is_active ? 'border-slate-200' : 'border-red-300'
              }`}
            >
              <div className="relative">
                <img
                  src={image.url}
                  alt={image.alt_text}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                  }}
                />
                {!image.is_active && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    {t('admin.galleryImages.inactive') || 'INACTIVA'}
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-slate-800 text-white text-xs px-2 py-1 rounded">
                  #{image.order_position}
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h4 className="font-semibold text-slate-900">{image.title}</h4>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{image.caption}</p>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>❤️ {image.likes}</span>
                  <span>💬 {image.comments}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => startEdit(image)}
                    className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded hover:bg-slate-200 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggleActive(image)}
                    className={`text-sm px-3 py-1 rounded transition-colors ${
                      image.is_active
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    {image.is_active
                      ? (t('admin.galleryImages.deactivate') || 'Desactivar')
                      : (t('admin.galleryImages.activate') || 'Activar')}
                  </button>
                  <button
                    onClick={() => handleDeleteImage(image.id)}
                    className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => handleMoveImage(index, 'up')}
                    disabled={index === 0}
                    className="flex-1 text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ↑ Subir
                  </button>
                  <button
                    onClick={() => handleMoveImage(index, 'down')}
                    disabled={index === images.length - 1}
                    className="flex-1 text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ↓ Bajar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryImageManager;
