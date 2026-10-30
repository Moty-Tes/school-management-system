import { toast } from "sonner";

export const sonner = toast;
export { toast };

export function useSonner() {
  return toast;
}