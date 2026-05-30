import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { addToast } from '../store/toastSlice';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T) =>
  useSelector(selector);

// Convenience toast hook
export const useToast = () => {
  const dispatch = useAppDispatch();
  return {
    success: (message: string) => dispatch(addToast({ message, type: 'success' })),
    error:   (message: string) => dispatch(addToast({ message, type: 'error' })),
    info:    (message: string) => dispatch(addToast({ message, type: 'info' })),
  };
};
