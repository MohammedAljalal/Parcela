import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiImage } from 'react-icons/fi';
import Modal from '../../components/Modal';
import { Field, Input, Select, Checkbox, Button, Badge } from '../../components/FormControls';
import * as adminApi from '../../api/admin';
import * as islandsApi from '../../api/islands';
import { toastSuccess, toastError, confirmDelete, apiErrorMessage } from '../../lib/alerts';

export default function BannersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['banners-admin'],
    queryFn: adminApi.listBannersAdmin,
  });

  const { data: islands = [] } = useQuery({ queryKey: ['islands-admin'], queryFn: islandsApi.listIslands });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['banners-admin'] });

  const openCreate = () => {
    setEditingBanner(null);
    setPreviewUrl('');
    reset({
      titlePt: '',
      titleEn: '',
      subtitlePt: '',
      subtitleEn: '',
      ctaLabelPt: 'Comprar Agora',
      ctaLabelEn: 'Shop Now',
      ctaLink: '',
      island: '',
      sortOrder: 0,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEdit = (banner) => {
    setEditingBanner(banner);
    setPreviewUrl(banner.image);
    reset({
      titlePt: banner.title?.pt || '',
      titleEn: banner.title?.en || '',
      subtitlePt: banner.subtitle?.pt || '',
      subtitleEn: banner.subtitle?.en || '',
      ctaLabelPt: banner.ctaLabel?.pt || '',
      ctaLabelEn: banner.ctaLabel?.en || '',
      ctaLink: banner.ctaLink || '',
      island: banner.island?._id || '',
      sortOrder: banner.sortOrder || 0,
      isActive: banner.isActive,
    });
    setIsModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: ({ payload, file }) => adminApi.createBanner(payload, file),
    onSuccess: () => {
      toastSuccess('Banner created successfully');
      invalidate();
      setIsModalOpen(false);
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to create banner')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload, file }) => adminApi.updateBanner(id, payload, file),
    onSuccess: () => {
      toastSuccess('Banner updated successfully');
      invalidate();
      setIsModalOpen(false);
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to update banner')),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteBanner,
    onSuccess: () => {
      toastSuccess('Banner deleted successfully');
      invalidate();
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to delete banner')),
  });

  const onSubmit = (values) => {
    const file = fileInputRef.current?.files?.[0];

    if (!editingBanner && !file) {
      toastError('Please choose an image for the banner');
      return;
    }

    const payload = {
      title: { pt: values.titlePt, en: values.titleEn || '' },
      subtitle: { pt: values.subtitlePt || '', en: values.subtitleEn || '' },
      ctaLabel: { pt: values.ctaLabelPt || '', en: values.ctaLabelEn || '' },
      ctaLink: values.ctaLink || '',
      island: values.island || null,
      sortOrder: values.sortOrder ?? 0,
      isActive: values.isActive ?? true,
    };

    if (editingBanner) updateMutation.mutate({ id: editingBanner._id, payload, file });
    else createMutation.mutate({ payload, file });
  };

  const handleDelete = async (banner) => {
    if (!(await confirmDelete(`the banner "${banner.title?.pt}"`))) return;
    deleteMutation.mutate(banner._id);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setPreviewUrl(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-ink">Banners</h1>
          <p className="text-ink-soft mt-1">Home screen promotional banners</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <FiPlus /> Add Banner
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-ink-soft">Loading...</div>
      ) : banners.length === 0 ? (
        <div className="bg-surface rounded-lg border border-border p-12 text-center text-ink-soft">
          <FiImage className="w-10 h-10 mx-auto mb-3 text-ink-faint" />
          No banners yet — add your first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {banners.map((banner) => (
            <div key={banner._id} className="bg-surface rounded-lg border border-border overflow-hidden shadow-card">
              <img src={banner.image} alt={banner.title?.pt} className="w-full h-36 object-cover" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-semibold text-ink">{banner.title?.pt}</h3>
                    <p className="text-xs text-ink-soft mt-1">{banner.island?.name || 'All islands'}</p>
                  </div>
                  <Badge color={banner.isActive ? 'success' : 'danger'}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openEdit(banner)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(banner)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-danger-50 text-danger-700 rounded-lg text-xs font-medium hover:bg-danger-100"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBanner ? 'Edit Banner' : 'Add Banner'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSubmit(onSubmit)()} disabled={isSubmitting}>
              {editingBanner ? 'Save Changes' : 'Create Banner'}
            </Button>
          </>
        }
      >
        <form onSubmit={(e) => handleSubmit(onSubmit)(e)} className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <Field label="Image" required={!editingBanner}>
              <div className="border-2 border-dashed border-border rounded-lg aspect-[4/3] flex items-center justify-center overflow-hidden bg-bg">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <FiImage className="w-8 h-8 text-ink-faint" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-2 text-xs w-full"
              />
            </Field>
          </div>

          <div className="col-span-2 space-y-1">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Title (Portuguese)" required>
                <Input {...register('titlePt', { required: true })} />
              </Field>
              <Field label="Title (English)">
                <Input {...register('titleEn')} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Subtitle (Portuguese)">
                <Input {...register('subtitlePt')} />
              </Field>
              <Field label="Subtitle (English)">
                <Input {...register('subtitleEn')} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Button Label (PT)">
                <Input {...register('ctaLabelPt')} />
              </Field>
              <Field label="Button Label (EN)">
                <Input {...register('ctaLabelEn')} />
              </Field>
            </div>
            <Field label="Button Link" hint="e.g. /products?category=electronics">
              <Input {...register('ctaLink')} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Island" hint="Leave empty to show on all islands">
                <Select {...register('island')}>
                  <option value="">All islands</option>
                  {islands.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Sort Order">
                <Input type="number" {...register('sortOrder')} />
              </Field>
            </div>
            <Field>
              <Checkbox label="Active" {...register('isActive')} />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
