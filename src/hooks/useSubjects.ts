import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Subject = Tables<"subjects">;

export const useSubjects = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["subjects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Subject[];
    },
    enabled: !!user,
  });

  const addSubject = useMutation({
    mutationFn: async (input: { name: string; color: string; icon: string }) => {
      const { data, error } = await supabase
        .from("subjects")
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateSubject = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Subject> & { id: string }) => {
      const { error } = await supabase.from("subjects").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const deleteSubject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { subjects: query.data ?? [], isLoading: query.isLoading, addSubject, updateSubject, deleteSubject };
};
