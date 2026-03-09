import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Material = Tables<"study_materials">;

export const useMaterials = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["materials", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_materials")
        .select("*, subjects(name, color)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addMaterial = useMutation({
    mutationFn: async (input: {
      title: string;
      subject_id: string;
      type?: string;
      content?: string;
      url?: string;
    }) => {
      const { data, error } = await supabase
        .from("study_materials")
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Material added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMaterial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("study_materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Material deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { materials: query.data ?? [], isLoading: query.isLoading, addMaterial, deleteMaterial };
};
