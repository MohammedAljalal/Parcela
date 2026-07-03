// Thin wrapper around SweetAlert2 so the rest of the app calls plain
// functions (toastSuccess, confirmDelete, ...) instead of repeating config.
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: { popup: 'parcela-swal' },
});

export const toastSuccess = (title) => Toast.fire({ icon: 'success', title });
export const toastError = (title) => Toast.fire({ icon: 'error', title });
export const toastInfo = (title) => Toast.fire({ icon: 'info', title });

export const confirmAction = async ({
  title = 'Are you sure?',
  text = '',
  confirmText = 'Confirm',
  icon = 'warning',
  danger = false,
}) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
    confirmButtonColor: danger ? '#EF4444' : '#1A3FB8',
    customClass: { popup: 'parcela-swal' },
    reverseButtons: true,
  });
  return result.isConfirmed;
};

export const confirmDelete = (itemLabel = 'this item') =>
  confirmAction({
    title: 'Delete this?',
    text: `This will permanently remove ${itemLabel}. This action cannot be undone.`,
    confirmText: 'Delete',
    icon: 'warning',
    danger: true,
  });

export const apiErrorMessage = (error, fallback = 'Something went wrong') => {
  const data = error?.response?.data;
  if (data?.errors?.length) return data.errors.join(', ');
  if (data?.message) return data.message;
  return fallback;
};
