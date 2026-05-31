// src/services/plantioService.ts
import { supabase } from './supabaseClient';

// ---------- GET ALL plantios for a user ----------
export const getPlantios = async (userId: string) => {
  const { data, error } = await supabase
    .from('plantios')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

// ---------- CREATE new plantio ----------
export const createPlantio = async (plantio: {
  cultura_id: string;
  variedade_id?: string;
  talhao_id?: string;
  data_plantio: string; // ISO date
  area?: number;
  unidade_area?: string;
  espacamento_linha?: number;
  espacamento_entre_linhas?: number;
  qtd_mudas?: number;
  sistema_cultivo?: string;
  sistema_irrigacao?: string;
  tipo_manejo?: string;
  custo_inicial?: number;
  descricao_custo?: string;
  observacoes?: string;
  status?: string;
  user_id: string;
}) => {
  const { data, error } = await supabase.from('plantios').insert([plantio]);
  if (error) throw error;
  return data;
};

// ---------- UPDATE existing plantio ----------
export const updatePlantio = async (
  id: string,
  updates: Partial<{
    cultura_id: string;
    variedade_id: string;
    talhao_id: string;
    data_plantio: string;
    area: number;
    unidade_area: string;
    espacamento_linha: number;
    espacamento_entre_linhas: number;
    qtd_mudas: number;
    sistema_cultivo: string;
    sistema_irrigacao: string;
    tipo_manejo: string;
    custo_inicial: number;
    descricao_custo: string;
    observacoes: string;
    status: string;
  }>
) => {
  const { data, error } = await supabase
    .from('plantios')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
  return data;
};

// ---------- DELETE plantio ----------
export const deletePlantio = async (id: string) => {
  const { error } = await supabase.from('plantios').delete().eq('id', id);
  if (error) throw error;
};
