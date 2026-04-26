'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useApp, THRESHOLDS } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, BarChart, Bar, Legend } from 'recharts';

const APERTURA_PUNTOS_MAESTRO: {planta:string;ramal:string;punto:string;ubicacion:string}[] = [
  {planta:"Sótano zona limpieza",ramal:"vestuario limpieza mujeres",punto:"GRIFO 1",ubicacion:"Vestuario hombres trabajadores"},
  {planta:"Sótano zona limpieza",ramal:"vestuario limpieza mujeres",punto:"GRIFO 2",ubicacion:"Vestuario hombres trabajadores"},
  {planta:"Sótano zona limpieza",ramal:"vestuario limpieza mujeres",punto:"GRIFO 3",ubicacion:"Vestuario hombres trabajadores"},
  {planta:"Sótano zona limpieza",ramal:"vestuario limpieza mujeres",punto:"DUCHA 1 isomix",ubicacion:"Vestuario hombres trabajadores"},
  {planta:"Sótano zona limpieza",ramal:"vestuario limpieza mujeres",punto:"DUCHA 2 isomix",ubicacion:"Vestuario hombres trabajadores"},
  {planta:"Sótano zona limpieza",ramal:"vestuario limpieza mujeres",punto:"DUCHA 3 isomix",ubicacion:"Vestuario hombres trabajadores"},
  {planta:"Sótano zona limpieza",ramal:"vestuario limpieza mujeres",punto:"GRIFO 1",ubicacion:"Vestuario mujeres limpieza"},
  {planta:"Sótano zona limpieza",ramal:"vestuario limpieza mujeres",punto:"GRIFO 2",ubicacion:"Vestuario mujeres limpieza"},
  {planta:"Sótano zona limpieza",ramal:"vestuario limpieza mujeres",punto:"DUCHA 1 isomix",ubicacion:"Vestuario mujeres limpieza"},
  {planta:"Sótano zona limpieza",ramal:"vestuario limpieza mujeres",punto:"DUCHA 2 isomix",ubicacion:"Vestuario mujeres limpieza"},
  {planta:"Sótano zona limpieza",ramal:"vestuario limpieza mujeres",punto:"DUCHA 3 isomix",ubicacion:"Vestuario mujeres limpieza"},
  {planta:"Sótano zona limpieza",ramal:"vestuario limpieza mujeres",punto:"GRIFO 1",ubicacion:"Aseo"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"GRIFO 1",ubicacion:"Vestuario -1.1"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"GRIFO 2",ubicacion:"Vestuario -1.1"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 1 isomix",ubicacion:"Vestuario -1.1"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 2 isomix",ubicacion:"Vestuario -1.1"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 3 isomix",ubicacion:"Vestuario -1.1"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 4 isomix",ubicacion:"Vestuario -1.1"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 5 isomix",ubicacion:"Vestuario -1.1"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 6 isomix",ubicacion:"Vestuario -1.1"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"GRIFO 1",ubicacion:"Vestuario -1.2"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"GRIFO 2",ubicacion:"Vestuario -1.2"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 1 isomix",ubicacion:"Vestuario -1.2"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 2 isomix",ubicacion:"Vestuario -1.2"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 3 isomix",ubicacion:"Vestuario -1.2"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 4 isomix",ubicacion:"Vestuario -1.2"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 5 isomix",ubicacion:"Vestuario -1.2"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 6 isomix",ubicacion:"Vestuario -1.2"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"GRIFO 1",ubicacion:"Vestuario -1.3"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"GRIFO 2",ubicacion:"Vestuario -1.3"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 1 isomix",ubicacion:"Vestuario -1.3"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 2 isomix",ubicacion:"Vestuario -1.3"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 3 isomix",ubicacion:"Vestuario -1.3"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 4 isomix",ubicacion:"Vestuario -1.3"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 5 isomix",ubicacion:"Vestuario -1.3"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 6 isomix",ubicacion:"Vestuario -1.3"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"GRIFO 1",ubicacion:"Vestuario -1.4"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"GRIFO 2",ubicacion:"Vestuario -1.4"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 1 isomix",ubicacion:"Vestuario -1.4"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 2 isomix",ubicacion:"Vestuario -1.4"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 3 isomix",ubicacion:"Vestuario -1.4"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 4 isomix",ubicacion:"Vestuario -1.4"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 5 isomix",ubicacion:"Vestuario -1.4"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 6 isomix",ubicacion:"Vestuario -1.4"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"GRIFO 1",ubicacion:"vestuario arbitros -1.1"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 1",ubicacion:"vestuario arbitros -1.1"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"GRIFO 1",ubicacion:"vestuario arbitros -1.2"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"DUCHA 1",ubicacion:"vestuario arbitros -1.2"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"GRIFO",ubicacion:"Aseo hombres"},
  {planta:"Sótano zona fútbol",ramal:"vestuario arbitros -1.2",punto:"GRIFO",ubicacion:"Aseo mujeres"},
  {planta:"Sótano zona médica",ramal:"vestuario arbitros -1.2",punto:"GRIFO 1",ubicacion:"Aseo zona médica"},
  {planta:"Sótano zona médica",ramal:"vestuario arbitros -1.2",punto:"GRIFO 2",ubicacion:"Aseo zona médica"},
  {planta:"Sótano zona médica",ramal:"vestuario arbitros -1.2",punto:"GRIFO",ubicacion:"Vestuario médicos mujeres"},
  {planta:"Sótano zona médica",ramal:"vestuario arbitros -1.2",punto:"DUCHA regulador manual",ubicacion:"Vestuario médicos mujeres"},
  {planta:"Sótano zona médica",ramal:"vestuario arbitros -1.2",punto:"GRIFO",ubicacion:"Vestuario médicos hombres"},
  {planta:"Sótano zona médica",ramal:"vestuario arbitros -1.2",punto:"DUCHA regulador manual",ubicacion:"Vestuario médicos hombres"},
  {planta:"Sótano zona médica",ramal:"vestuario arbitros -1.2",punto:"GRIFO 1",ubicacion:"Centro fisioterapia"},
  {planta:"Sótano zona médica",ramal:"vestuario arbitros -1.2",punto:"GRIFO 2",ubicacion:"Centro fisioterapia"},
  {planta:"Sótano zona médica",ramal:"vestuario arbitros -1.2",punto:"GRIFO 3",ubicacion:"Centro fisioterapia"},
  {planta:"Baja zona piscina",ramal:"duchas piscina",punto:"DUCHA 1 isomix",ubicacion:"Piscina"},
  {planta:"Baja zona piscina",ramal:"duchas piscina",punto:"DUCHA 2 isomix",ubicacion:"Piscina"},
  {planta:"Baja zona piscina",ramal:"duchas piscina",punto:"DUCHA 3 isomix",ubicacion:"Piscina"},
  {planta:"Baja zona piscina",ramal:"duchas piscina",punto:"DUCHA 4 isomix",ubicacion:"Piscina"},
  {planta:"Baja zona piscina",ramal:"duchas piscina",punto:"DUCHA 5 isomix",ubicacion:"Piscina"},
  {planta:"Baja zona piscina",ramal:"duchas piscina",punto:"DUCHA 6 isomix",ubicacion:"Piscina"},
  {planta:"Baja zona piscina",ramal:"duchas piscina",punto:"DUCHA 7 isomix",ubicacion:"Piscina"},
  {planta:"Baja zona piscina",ramal:"duchas piscina",punto:"DUCHA 8 isomix",ubicacion:"Piscina"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO",ubicacion:"Aseo mujeres"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 1",ubicacion:"Aseo hombres"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 2",ubicacion:"Aseo hombres"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO",ubicacion:"Aseo minusválidos"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 1",ubicacion:"vestuario 0.1"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 2",ubicacion:"vestuario 0.1"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 3",ubicacion:"vestuario 0.1"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 1 regulador manual",ubicacion:"vestuario 0.1"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 2 regulador manual",ubicacion:"vestuario 0.1"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 3 regulador manual",ubicacion:"vestuario 0.1"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 4 regulador manual",ubicacion:"vestuario 0.1"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 5 regulador manual",ubicacion:"vestuario 0.1"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 6 regulador manual",ubicacion:"vestuario 0.1"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 7 regulador manual",ubicacion:"vestuario 0.1"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 8 agua fría",ubicacion:"vestuario 0.1"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 9 agua fría",ubicacion:"vestuario 0.1"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 1",ubicacion:"vestuario 0.2"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 2",ubicacion:"vestuario 0.2"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 3",ubicacion:"vestuario 0.2"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 1 regulador manual",ubicacion:"vestuario 0.2"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 2 regulador manual",ubicacion:"vestuario 0.2"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 3 regulador manual",ubicacion:"vestuario 0.2"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 4 regulador manual",ubicacion:"vestuario 0.2"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 5 regulador manual",ubicacion:"vestuario 0.2"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 6 regulador manual",ubicacion:"vestuario 0.2"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 7 regulador manual",ubicacion:"vestuario 0.2"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 8 agua fría",ubicacion:"vestuario 0.2"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 9 agua fría",ubicacion:"vestuario 0.2"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 1",ubicacion:"vestuario 0.3"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 2",ubicacion:"vestuario 0.3"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 3",ubicacion:"vestuario 0.3"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 1 regulador manual",ubicacion:"vestuario 0.3"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 2 regulador manual",ubicacion:"vestuario 0.3"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 3 regulador manual",ubicacion:"vestuario 0.3"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 4 regulador manual",ubicacion:"vestuario 0.3"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 5 regulador manual",ubicacion:"vestuario 0.3"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 6 regulador manual",ubicacion:"vestuario 0.3"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 7 regulador manual",ubicacion:"vestuario 0.3"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 8 agua fría",ubicacion:"vestuario 0.3"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 9 agua fría",ubicacion:"vestuario 0.3"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 1",ubicacion:"vestuario 0.4 limpieza"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 2",ubicacion:"vestuario 0.4 limpieza"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 1",ubicacion:"vestuario 0.5"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 2",ubicacion:"vestuario 0.5"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 3",ubicacion:"vestuario 0.5"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA  isomix 1",ubicacion:"vestuario 0.5"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA  isomix 2",ubicacion:"vestuario 0.5"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA  isomix 3",ubicacion:"vestuario 0.5"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA  isomix 4",ubicacion:"vestuario 0.5"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA  isomix 5",ubicacion:"vestuario 0.5"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA  isomix 6",ubicacion:"vestuario 0.5"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA  isomix 7",ubicacion:"vestuario 0.5"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA  isomix 8",ubicacion:"vestuario 0.5"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA  isomix 9",ubicacion:"vestuario 0.5"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 1",ubicacion:"vestuario 0.6"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 2",ubicacion:"vestuario 0.6"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 3",ubicacion:"vestuario 0.6"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA  isomix 1",ubicacion:"vestuario 0.6"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA  isomix 2",ubicacion:"vestuario 0.6"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA  isomix 3",ubicacion:"vestuario 0.6"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA  isomix 4",ubicacion:"vestuario 0.6"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA  isomix 5",ubicacion:"vestuario 0.6"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA  isomix 6",ubicacion:"vestuario 0.6"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA  isomix 7",ubicacion:"vestuario 0.6"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA  isomix 8",ubicacion:"vestuario 0.6"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA  isomix 9",ubicacion:"vestuario 0.6"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 1",ubicacion:"vestuario 0.7 personal"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 2",ubicacion:"vestuario 0.7 personal"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 3",ubicacion:"vestuario 0.7 personal"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"GRIFO 4",ubicacion:"vestuario 0.7 personal"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 1 regulador manual",ubicacion:"vestuario 0.7 personal"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 2 regulador manual",ubicacion:"vestuario 0.7 personal"},
  {planta:"Baja zona vestuarios",ramal:"vestuario 0.7",punto:"DUCHA 3 regulador manual",ubicacion:"vestuario 0.7 personal"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"GRIFO",ubicacion:"vestuario 1 familiar"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"GRIFO",ubicacion:"vestuario 2 familiar"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"GRIFO",ubicacion:"vestuario 3 minusválidos"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"DUCHA regulador manual",ubicacion:"vestuario 3 minusválidos"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"GRIFO",ubicacion:"vestuario 4 minusválidos"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"DUCHA regulador manual",ubicacion:"vestuario 4 minusválidos"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"GRIFO 1",ubicacion:"vestuario mujeres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"GRIFO 2",ubicacion:"vestuario mujeres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"GRIFO 3",ubicacion:"vestuario mujeres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"GRIFO 4",ubicacion:"vestuario mujeres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"GRIFO 5",ubicacion:"vestuario mujeres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"GRIFO 6",ubicacion:"vestuario mujeres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"DUCHA 1 regulador manual",ubicacion:"vestuario mujeres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"DUCHA 2 regulador manual",ubicacion:"vestuario mujeres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"DUCHA 3 regulador manual",ubicacion:"vestuario mujeres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"DUCHA 4 regulador manual",ubicacion:"vestuario mujeres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"DUCHA 5 regulador manual",ubicacion:"vestuario mujeres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"DUCHA 6 regulador manual",ubicacion:"vestuario mujeres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"DUCHA 7 regulador manual",ubicacion:"vestuario mujeres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"GRIFO 1",ubicacion:"Vestuario hombres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"GRIFO 2",ubicacion:"Vestuario hombres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"GRIFO 3",ubicacion:"Vestuario hombres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"GRIFO 4",ubicacion:"Vestuario hombres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"GRIFO 5",ubicacion:"Vestuario hombres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"GRIFO 6",ubicacion:"Vestuario hombres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"DUCHA 1 regulador manual",ubicacion:"Vestuario hombres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"DUCHA 2 regulador manual",ubicacion:"Vestuario hombres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"DUCHA 3 regulador manual",ubicacion:"Vestuario hombres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"DUCHA 4 regulador manual",ubicacion:"Vestuario hombres"},
  {planta:"Baja vest. hidromasaje",ramal:"vestuarios hombres",punto:"DUCHA 5 regulador manual",ubicacion:"Vestuario hombres"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"GRIFO",ubicacion:"Vestuario 1"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA",ubicacion:"Vestuario 1"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"GRIFO",ubicacion:"Vestuario 2"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"GRIFO",ubicacion:"Vestuario 3 minusválidos"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA",ubicacion:"Vestuario 3 minusválidos"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"GRIFO",ubicacion:"Vestuario 4 minusválidos"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA",ubicacion:"Vestuario 4 minusválidos"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"GRIFO",ubicacion:"Aseo poco uso"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"GRIFO 1",ubicacion:"Servicios mujeres"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"GRIFO 2",ubicacion:"Servicios mujeres"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"GRIFO 3",ubicacion:"Servicios mujeres"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"GRIFO 4",ubicacion:"Servicios mujeres"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"GRIFO 1",ubicacion:"Servicios hombres"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"GRIFO 2",ubicacion:"Servicios hombres"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"GRIFO",ubicacion:"Zona socorristas enfermería"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"GRIFO 1",ubicacion:"vestuario mujeres 5"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"GRIFO 2",ubicacion:"vestuario mujeres 5"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA  isomix 1",ubicacion:"vestuario mujeres 5"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA  isomix 2",ubicacion:"vestuario mujeres 5"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA  isomix 3",ubicacion:"vestuario mujeres 5"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA  isomix 4",ubicacion:"vestuario mujeres 5"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA  isomix 5",ubicacion:"vestuario mujeres 5"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA  isomix 6",ubicacion:"vestuario mujeres 5"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA  isomix 7",ubicacion:"vestuario mujeres 5"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"GRIFO 1",ubicacion:"vestuario mujeres 6"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"GRIFO 2",ubicacion:"vestuario mujeres 6"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA 1 regulador manual",ubicacion:"vestuario mujeres 6"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA 2 regulador manual",ubicacion:"vestuario mujeres 6"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA 3 regulador manual",ubicacion:"vestuario mujeres 6"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA 4 regulador manual",ubicacion:"vestuario mujeres 6"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA 5 regulador manual",ubicacion:"vestuario mujeres 6"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA 6 regulador manual",ubicacion:"vestuario mujeres 6"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA 7 regulador manual",ubicacion:"vestuario mujeres 6"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"GRIFO 1",ubicacion:"Vestuario hombres 7"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"GRIFO 2",ubicacion:"Vestuario hombres 7"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA  isomix 1",ubicacion:"Vestuario hombres 7"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA  isomix 2",ubicacion:"Vestuario hombres 7"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA  isomix 3",ubicacion:"Vestuario hombres 7"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA  isomix 4",ubicacion:"Vestuario hombres 7"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA  isomix 5",ubicacion:"Vestuario hombres 7"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA  isomix 6",ubicacion:"Vestuario hombres 7"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA  isomix 7",ubicacion:"Vestuario hombres 7"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"GRIFO 1",ubicacion:"Vestuario hombres 8"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"GRIFO 2",ubicacion:"Vestuario hombres 8"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA 1 regulador manual",ubicacion:"Vestuario hombres 8"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA 2 regulador manual",ubicacion:"Vestuario hombres 8"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA 3 regulador manual",ubicacion:"Vestuario hombres 8"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA 4 regulador manual",ubicacion:"Vestuario hombres 8"},
  {planta:"Baja vest. piscina",ramal:"vestuario hombres 8",punto:"DUCHA 5 regulador manual",ubicacion:"Vestuario hombres 8"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"GRIFO 1",ubicacion:"Aseo hombres"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"GRIFO 2",ubicacion:"Aseo hombres"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"GRIFO 1",ubicacion:"Aseo mujeres"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"GRIFO 2",ubicacion:"Aseo mujeres"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"GRIFO 1",ubicacion:"Vestuario 1.1"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"GRIFO 2",ubicacion:"Vestuario 1.1"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 1",ubicacion:"Vestuario 1.1"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 2",ubicacion:"Vestuario 1.1"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 3",ubicacion:"Vestuario 1.1"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 4",ubicacion:"Vestuario 1.1"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 5",ubicacion:"Vestuario 1.1"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"GRIFO 1",ubicacion:"Vestuario 1.2"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"GRIFO 2",ubicacion:"Vestuario 1.2"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 1",ubicacion:"Vestuario 1.2"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 2",ubicacion:"Vestuario 1.2"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 3",ubicacion:"Vestuario 1.2"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 4",ubicacion:"Vestuario 1.2"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 5",ubicacion:"Vestuario 1.2"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 6",ubicacion:"Vestuario 1.2"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"GRIFO 1",ubicacion:"Vestuario 1.3"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"GRIFO 2",ubicacion:"Vestuario 1.3"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 1",ubicacion:"Vestuario 1.3"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 2",ubicacion:"Vestuario 1.3"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 3",ubicacion:"Vestuario 1.3"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 4",ubicacion:"Vestuario 1.3"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 5",ubicacion:"Vestuario 1.3"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 6",ubicacion:"Vestuario 1.3"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"GRIFO 1",ubicacion:"Vestuario 1.4"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"GRIFO 2",ubicacion:"Vestuario 1.4"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 1",ubicacion:"Vestuario 1.4"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 2",ubicacion:"Vestuario 1.4"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 3",ubicacion:"Vestuario 1.4"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 4",ubicacion:"Vestuario 1.4"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 5",ubicacion:"Vestuario 1.4"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 6",ubicacion:"Vestuario 1.4"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"GRIFO 1",ubicacion:"Vestuario 1.5"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"GRIFO 2",ubicacion:"Vestuario 1.5"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 1",ubicacion:"Vestuario 1.5"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 2",ubicacion:"Vestuario 1.5"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 3",ubicacion:"Vestuario 1.5"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 4",ubicacion:"Vestuario 1.5"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 5",ubicacion:"Vestuario 1.5"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 6",ubicacion:"Vestuario 1.5"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"GRIFO 1",ubicacion:"Vestuario 1.6"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"GRIFO 2",ubicacion:"Vestuario 1.6"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 1",ubicacion:"Vestuario 1.6"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 2",ubicacion:"Vestuario 1.6"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 3",ubicacion:"Vestuario 1.6"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 4",ubicacion:"Vestuario 1.6"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 5",ubicacion:"Vestuario 1.6"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"DUCHA  isomix 6",ubicacion:"Vestuario 1.6"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"GRIFO",ubicacion:"Vestuario arbitros1.1"},
  {planta:"Primera vestuarios",ramal:"vestuario 1.6",punto:"GRIFO anulado",ubicacion:"Vestuario arbitros1.2"},
  {planta:"Segunda",ramal:"ramal único sólo AFCH",punto:"GRIFO",ubicacion:"Aseo minusválidos"},
  {planta:"Segunda",ramal:"ramal único sólo AFCH",punto:"GRIFO 1",ubicacion:"Servicios mujeres"},
  {planta:"Segunda",ramal:"ramal único sólo AFCH",punto:"GRIFO 2",ubicacion:"Servicios mujeres"},
  {planta:"Segunda",ramal:"ramal único sólo AFCH",punto:"GRIFO 3",ubicacion:"Servicios mujeres"},
  {planta:"Segunda",ramal:"ramal único sólo AFCH",punto:"GRIFO 4",ubicacion:"Servicios mujeres"},
  {planta:"Segunda",ramal:"ramal único sólo AFCH",punto:"GRIFO 5",ubicacion:"Servicios mujeres"},
  {planta:"Segunda",ramal:"ramal único sólo AFCH",punto:"GRIFO 6",ubicacion:"Servicios mujeres"},
  {planta:"Segunda",ramal:"ramal único sólo AFCH",punto:"GRIFO 7",ubicacion:"Servicios mujeres"},
  {planta:"Segunda",ramal:"ramal único sólo AFCH",punto:"GRIFO 8",ubicacion:"Servicios mujeres"},
  {planta:"Segunda",ramal:"ramal único sólo AFCH",punto:"GRIFO 9",ubicacion:"Servicios mujeres"},
  {planta:"Segunda",ramal:"ramal único sólo AFCH",punto:"GRIFO 10",ubicacion:"Servicios mujeres"},
  {planta:"Segunda",ramal:"ramal único sólo AFCH",punto:"GRIFO 1",ubicacion:"Servicios hombres"},
  {planta:"Segunda",ramal:"ramal único sólo AFCH",punto:"GRIFO 2",ubicacion:"Servicios hombres"},
  {planta:"Segunda",ramal:"ramal único sólo AFCH",punto:"GRIFO 3",ubicacion:"Servicios hombres"},
  {planta:"Segunda",ramal:"ramal único sólo AFCH",punto:"GRIFO 4",ubicacion:"Servicios hombres"},
  {planta:"Segunda",ramal:"ramal único sólo AFCH",punto:"GRIFO 5",ubicacion:"Servicios hombres"},
  {planta:"Segunda",ramal:"ramal único sólo AFCH",punto:"GRIFO 6",ubicacion:"Servicios hombres"},
];

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// Fixed point lists from the official excel
const TERMOMETROS_POINTS = [
  'entrada sotano por vestuarios',
  'salida ACS',
  'vestuario hombres pisina',
  'vestuario hombres hidromasaje',
  'vestuario futbol -1.2',
  'vestuario cancha arriba 1.6',
  'vestuario 0.8',
];

const PURGA_MENSUAL_POINTS = [
  'vestuario limpieza mujeres',
  'vestuario arbitros -1.2',
  'duchas piscina',
  'vestuario 0.7',
  'vestuarios hombres hidromasaje',
  'vestuario hombres 8 piscina',
  'vestuario 1.6',
];

function valueClass(v: number | null | undefined, min: number, max: number) {
  if (v == null) return '';
  return (v < min || v > max) ? 'val-danger' : 'val-ok';
}

interface PurgaSemanal { id: string; year: number; month: number; week: number; fecha_realizacion: string | null; nombre: string | null; realizada: boolean; }
interface TurbidezSemanal { id: string; year: number; month: number; week: number; turbidez: number | null; punto_medida: string | null; nombre: string | null; }
interface AperturaSemanal { id: string; year: number; month: number; week: number; todos_abiertos: boolean; fecha_realizacion: string | null; nombre: string | null; observaciones: string | null; }
interface AperturaTerminal { id: string; year: number; month: number; planta: string | null; ramal: string | null; punto_terminal: string | null; ubicacion: string | null; semana_1: string | null; semana_2: string | null; semana_3: string | null; semana_4: string | null; semana_5: string | null; }


// ─── PDF Export Legionella ────────────────────────────────────────────────────
function exportLegionellaPDF(
  month: number,
  tempsMonth: any[],
  biocidaMonth: any[],
  purgaSemMonth: any[],
  turbidezMonth: any[],
  aperturaSemMonth: { year:number; month:number; week:number; todos_abiertos:boolean; fecha_realizacion:string|null; nombre:string|null }[],
) {
  const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const monthName = MONTHS[month - 1];

  const clr = (v: number | null, min: number, max: number) =>
    v == null ? '#888' : (v < min || v > max) ? '#dc2626' : '#15803d';

  const tempRows = [...tempsMonth].reverse().map(t => `
    <tr>
      <td>${t.date}</td>
      <td style="color:${clr(t.tempRetorno,50,65)};font-weight:600">${t.tempRetorno?.toFixed(1)??'—'}°C</td>
      <td style="color:${clr(t.tempDeposito1,60,70)};font-weight:600">${t.tempDeposito1?.toFixed(1)??'—'}°C</td>
      <td style="color:${clr(t.tempDeposito2,60,70)};font-weight:600">${t.tempDeposito2?.toFixed(1)??'—'}°C</td>
      <td>${t.tempRamal1?.toFixed(1)??'—'}°C</td>
      <td>${t.tempRamal2?.toFixed(1)??'—'}°C</td>
    </tr>`).join('');

  const bioRows = [...biocidaMonth].reverse().map(b => {
    const ok = (b.biocida!=null&&b.biocida>=0.2&&b.biocida<=2.0)&&(b.ph!=null&&b.ph>=7.0&&b.ph<=8.0);
    return `<tr>
      <td>${b.date}</td>
      <td style="color:${clr(b.biocida,0.2,2.0)};font-weight:600">${b.biocida?.toFixed(2)??'—'}</td>
      <td style="color:${clr(b.ph,7.0,8.0)};font-weight:600">${b.ph?.toFixed(2)??'—'}</td>
      <td>${b.puntoDeMedida??'—'}</td>
      <td>${b.nombre??'—'}</td>
      <td style="color:${ok?'#15803d':'#dc2626'};font-weight:700">${ok?'✓ Conforme':'✗ Revisar'}</td>
    </tr>`;
  }).join('');

  const purgaSemRows = [1,2,3,4,5].map(w => {
    const r = purgaSemMonth.find((p:any) => p.week === w);
    return `<tr>
      <td style="font-weight:600">Semana ${w}</td>
      <td>${r?.fecha_realizacion ? `Día ${r.fecha_realizacion}` : '—'}</td>
      <td style="text-transform:capitalize">${r?.nombre??'—'}</td>
      <td style="color:${r?.realizada?'#15803d':'#d97706'};font-weight:700">${r?.realizada?'✓ Realizada':'Pendiente'}</td>
    </tr>`;
  }).join('');

  const turbidezRows = [1,2,3,4,5].map(w => {
    const r = turbidezMonth.find((t:any) => t.week === w);
    const tv = r?.turbidez;
    return `<tr>
      <td style="font-weight:600">Semana ${w}</td>
      <td style="color:${tv!=null?(tv>1?'#dc2626':'#15803d'):'#888'};font-weight:600">${tv!=null?tv.toFixed(2):'—'} UNF</td>
      <td style="text-transform:capitalize">${r?.punto_medida??'—'}</td>
      <td style="text-transform:capitalize">${r?.nombre??'—'}</td>
    </tr>`;
  }).join('');

  // Apertura: build semana summary from simple check table, then list all 289 points
  // Each semana row says whether ALL terminals were opened that week
  const semLookup: Record<number, typeof aperturaSemMonth[0]> = {};
  for (const s of aperturaSemMonth) { semLookup[s.week] = s; }

  const svSem = (week: number) => {
    const s = semLookup[week];
    if (!s) return {v:'—', c:'#888'};
    return s.todos_abiertos ? {v:'✓', c:'#15803d'} : {v:'✗', c:'#dc2626'};
  };

  // Summary header rows (one per week)
  const aperturaSummaryRows = [1,2,3,4,5].map(w => {
    const s = semLookup[w];
    const sv2 = svSem(w);
    return `<tr>
      <td style="font-weight:600">Semana ${w}</td>
      <td>${s?.fecha_realizacion??'—'}</td>
      <td style="text-transform:capitalize">${s?.nombre??'—'}</td>
      <td style="color:${sv2.c};font-weight:700;font-size:12pt">${sv2.v} ${s ? (s.todos_abiertos ? 'Todos abiertos' : 'No todos abiertos') : 'Pendiente'}</td>
    </tr>`;
  }).join('');

  // Full point list: group master list by planta then ramal, apply semana results to all
  const byPlantaRamal: Record<string, Record<string, typeof APERTURA_PUNTOS_MAESTRO>> = {};
  for (const p of APERTURA_PUNTOS_MAESTRO) {
    if (!byPlantaRamal[p.planta]) byPlantaRamal[p.planta] = {};
    if (!byPlantaRamal[p.planta][p.ramal]) byPlantaRamal[p.planta][p.ramal] = [];
    byPlantaRamal[p.planta][p.ramal].push(p);
  }

  const aperturaRows = Object.entries(byPlantaRamal).map(([planta, ramales]) => {
    const plantaHeader = `<tr style="background:#0f1f3d"><td colspan="7" style="font-weight:700;color:#fff;padding:7px 10px;font-size:9pt;text-transform:uppercase;letter-spacing:.04em">${planta}</td></tr>`;
    const ramalRows = Object.entries(ramales).map(([ramal, pts]) => {
      const ramalHeader = `<tr style="background:#f1f5f9"><td colspan="7" style="font-weight:700;color:#334155;text-transform:capitalize;padding:5px 10px 5px 20px;font-size:8.5pt">↳ ${ramal}</td></tr>`;
      const ptRows = pts.map(p => {
        return `<tr>
          <td style="font-size:8.5pt;text-transform:uppercase;font-weight:600;padding-left:28px">${p.punto}</td>
          <td style="font-size:8pt;color:#64748b">${p.ubicacion}</td>
          ${[1,2,3,4,5].map(w => { const sv2=svSem(w); return `<td style="text-align:center;color:${sv2.c};font-weight:700;font-size:10pt">${sv2.v}</td>`; }).join('')}
        </tr>`;
      }).join('');
      return ramalHeader + ptRows;
    }).join('');
    return plantaHeader + ramalRows;
  }).join('');

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Registro Legionella — ${monthName} 2026</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700&family=Source+Sans+3:wght@300;400;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Source Sans 3',sans-serif;font-size:9.5pt;color:#1a1a2e;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.cover{page-break-after:always;min-height:100vh;display:flex;flex-direction:column;justify-content:space-between;padding:60px 72px;position:relative}
.cover::before{content:'';position:absolute;top:0;left:0;right:0;height:8px;background:linear-gradient(90deg,#0f1f3d,#0f6e56 50%,#22c55e)}
.cover-logo{font-family:'Source Serif 4',serif;font-size:13pt;font-weight:700;color:#0f1f3d}.cover-logo span{color:#0f6e56}
.cover-badge{font-size:8pt;font-weight:600;color:#0f6e56;border:1.5px solid #0f6e56;padding:4px 10px;border-radius:20px;letter-spacing:.05em;text-transform:uppercase}
.cover-logo-area{display:flex;justify-content:space-between;align-items:flex-start}
.cover-title{font-family:'Source Serif 4',serif;font-size:32pt;font-weight:700;color:#0f1f3d;line-height:1.15;margin-bottom:16px}
.cover-subtitle{font-size:13pt;font-weight:300;color:#475569;line-height:1.5;max-width:520px}
.cover-divider{width:60px;height:4px;background:linear-gradient(90deg,#0f6e56,#22c55e);border-radius:2px;margin:28px 0}
.cover-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-bottom:50px}
.cover-meta-item label{display:block;font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin-bottom:6px}
.cover-meta-item p{font-size:10pt;font-weight:600;color:#0f1f3d}
.cover-footer{border-top:1px solid #e2e8f0;padding-top:18px;display:flex;justify-content:space-between;align-items:center}
.cover-footer-text{font-size:8pt;color:#94a3b8}.cover-legal{font-size:7.5pt;color:#94a3b8;max-width:380px;text-align:right;line-height:1.5}
@page{margin:16mm 14mm;size:A4}
.section{page-break-inside:avoid;margin-bottom:28px}
.section-header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0}
.section-title{font-family:'Source Serif 4',serif;font-size:13pt;font-weight:700;color:#0f1f3d}
.section-sub{font-size:8pt;color:#64748b}
table{width:100%;border-collapse:collapse;font-size:8.5pt;page-break-inside:auto}
thead{display:table-header-group}tr{page-break-inside:avoid}
th{background:#0f1f3d;color:#fff;padding:7px 9px;text-align:left;font-size:7.5pt;font-weight:600;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
td{padding:6px 9px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
tr:nth-child(even) td{background:#fafbfc}
.legend{display:flex;gap:16px;padding:8px 12px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;margin-bottom:12px;flex-wrap:wrap}
.legend-item{display:flex;align-items:center;gap:5px;font-size:7.5pt;color:#475569}
.legend-dot{width:9px;height:9px;border-radius:50%;display:inline-block;flex-shrink:0}
.page-footer{position:fixed;bottom:0;left:14mm;right:14mm;height:12mm;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;font-size:7pt;color:#94a3b8}
.sig-area{margin-top:36px;page-break-inside:avoid}
</style></head><body>

<!-- PORTADA -->
<div class="cover">
  <div class="cover-logo-area"><div class="cover-logo">Aqua<span>Dash</span></div><div class="cover-badge">Documento oficial</div></div>
  <div>
    <div style="font-size:9pt;font-weight:600;color:#0f6e56;text-transform:uppercase;letter-spacing:.12em;margin-bottom:18px">Registro de control sanitario</div>
    <div class="cover-title">Control de<br>Legionella<br>${monthName} 2026</div>
    <div class="cover-divider"></div>
    <div class="cover-subtitle">Registro oficial de vigilancia y control conforme al Real Decreto 487/2022 y protocolo del Gobierno Vasco para instalaciones de agua caliente sanitaria.</div>
  </div>
  <div class="cover-meta-grid">
    <div class="cover-meta-item"><label>Período</label><p>${monthName} 2026</p></div>
    <div class="cover-meta-item"><label>Fecha de emisión</label><p>${today}</p></div>
    <div class="cover-meta-item"><label>Mediciones temperatura</label><p>${tempsMonth.length} registros</p></div>
  </div>
  <div class="cover-footer">
    <div class="cover-footer-text">Generado por <strong>AquaDash</strong> · Sistema de gestión de instalaciones acuáticas</div>
    <div class="cover-legal">Documento emitido electrónicamente. Los datos corresponden a mediciones registradas por personal técnico cualificado.</div>
  </div>
</div>

<div class="page-footer"><span><strong>AquaDash</strong> — Control Legionella · ${monthName} 2026</span><span>Emitido: ${today}</span></div>

<div class="legend">
  <strong style="font-size:8pt;color:#334155;margin-right:6px">Leyenda:</strong>
  <div class="legend-item"><div class="legend-dot" style="background:#15803d"></div>Conforme</div>
  <div class="legend-item"><div class="legend-dot" style="background:#dc2626"></div>Fuera de rango / No conforme</div>
  <div class="legend-item"><div class="legend-dot" style="background:#d97706"></div>Pendiente</div>
  <div class="legend-item"><div class="legend-dot" style="background:#888"></div>Sin dato</div>
</div>

<!-- 1. TEMPERATURAS ACS -->
<div class="section">
  <div class="section-header"><div class="section-title">1. Temperatura diaria ACS</div><div class="section-sub">Retorno ≥ 50°C · Depósitos ≥ 60°C</div></div>
  ${tempsMonth.length === 0 ? '<p style="color:#94a3b8;font-size:9pt;padding:12px 0">Sin registros este mes</p>' : `
  <table>
    <thead><tr><th>Fecha</th><th>Tª Retorno (°C)</th><th>Tª Depósito 1 (°C)</th><th>Tª Depósito 2 (°C)</th><th>Ramal 1</th><th>Ramal 2</th></tr></thead>
    <tbody>${tempRows}</tbody>
  </table>`}
</div>

<!-- 2. BIOCIDA Y PH -->
<div class="section" style="page-break-before:always">
  <div class="section-header"><div class="section-title">2. Biocida y pH agua de entrada</div><div class="section-sub">Biocida 0.2–2.0 mg/L · pH 7.0–8.0</div></div>
  ${biocidaMonth.length === 0 ? '<p style="color:#94a3b8;font-size:9pt;padding:12px 0">Sin registros este mes</p>' : `
  <table>
    <thead><tr><th>Fecha</th><th>Biocida (mg/L)</th><th>pH agua entrada</th><th>Punto de medida</th><th>Responsable</th><th>Resultado</th></tr></thead>
    <tbody>${bioRows}</tbody>
  </table>`}
</div>

<!-- 3. PURGA SEMANAL ACUMULADORES -->
<div class="section" style="page-break-before:always">
  <div class="section-header"><div class="section-title">3. Purga semanal acumuladores</div><div class="section-sub">Frecuencia: semanal · Sistema ACS 2×5000L</div></div>
  <table>
    <thead><tr><th>Semana</th><th>Fecha de realización</th><th>Responsable</th><th>Estado</th></tr></thead>
    <tbody>${purgaSemRows}</tbody>
  </table>
</div>

<!-- 4. TURBIDEZ SEMANAL -->
<div class="section">
  <div class="section-header"><div class="section-title">4. Medida semanal de turbidez</div><div class="section-sub">Referencia: ≤ 1 UNF en puntos terminales</div></div>
  <table>
    <thead><tr><th>Semana</th><th>Turbidez (UNF)</th><th>Punto de medida</th><th>Responsable</th></tr></thead>
    <tbody>${turbidezRows}</tbody>
  </table>
</div>

<!-- 5. APERTURA PUNTOS TERMINALES -->
${`
<div class="section" style="page-break-before:always">
  <div class="section-header"><div class="section-title">5. Apertura semanal puntos terminales</div><div class="section-sub">Apertura manual de terminales no utilizados</div></div>
  <p style="font-size:8.5pt;color:#475569;margin-bottom:12px">Resumen semanal: indica si se abrieron todos los puntos terminales de la instalación.</p>
  <table style="margin-bottom:20px">
    <thead><tr><th>Semana</th><th>Fecha</th><th>Responsable</th><th>Resultado</th></tr></thead>
    <tbody>${aperturaSummaryRows}</tbody>
  </table>
  <p style="font-size:8.5pt;color:#475569;margin-bottom:10px">Listado completo de puntos terminales de la instalación (289 puntos):</p>
  <table>
    <thead><tr><th>Punto terminal</th><th>Ubicación</th><th style="text-align:center">S1</th><th style="text-align:center">S2</th><th style="text-align:center">S3</th><th style="text-align:center">S4</th><th style="text-align:center">S5</th></tr></thead>
    <tbody>${aperturaRows}</tbody>
  </table>
</div>`}

<!-- FIRMAS -->
<div class="sig-area">
  <div class="section-header"><div class="section-title">Validación y firmas</div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:40px;margin-top:20px">
    ${['Técnico responsable','Supervisor de instalación','Responsable sanitario'].map(r=>`
    <div><p style="font-size:8pt;color:#64748b;margin-bottom:44px">${r}</p>
    <div style="border-top:1px solid #334155;padding-top:6px"><p style="font-size:8pt;color:#94a3b8">Nombre y firma</p></div></div>`).join('')}
  </div>
  <div style="margin-top:24px;padding:12px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
    <p style="font-size:7.5pt;color:#64748b;line-height:1.6"><strong>Nota legal:</strong> Documento oficial de control de legionella conforme al Real Decreto 487/2022 sobre instalaciones de riesgo de proliferación y dispersión de Legionella. Emitido mediante sistema informatizado AquaDash. En caso de incumplimiento de los valores de referencia, se tomarán las medidas correctoras establecidas en el Plan de Mantenimiento.</p>
  </div>
</div>

</body></html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) win.onload = () => { setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 800); };
}

export default function LegionellaPage() {
  const { hasPermission, legionellaTemps, legionellaBiocida, alerts, addLegionellaTemp, addLegionellaBiocida } = useApp();
  const [tab, setTab] = useState<'temperaturas' | 'biocida' | 'semanales' | 'mensuales'>('temperaturas');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<'temp' | 'biocida' | 'purga_sem' | 'turbidez_sem' | 'purga_men' | 'termometros' | 'apertura'>('temp');
  const [saving, setSaving] = useState(false);

  // Form state
  const [fDate, setFDate] = useState(new Date().toISOString().split('T')[0]);
  const [fMonth, setFMonth] = useState(String(new Date().getMonth() + 1));
  const [fRetorno, setFRetorno] = useState('');
  const [fDep1, setFDep1] = useState('');
  const [fDep2, setFDep2] = useState('');
  const [fRamal1, setFRamal1] = useState('');
  const [fRamal2, setFRamal2] = useState('');
  const [fBiocida, setFBiocida] = useState('');
  const [fPh, setFPh] = useState('');
  const [fPunto, setFPunto] = useState('');
  const [fNombre, setFNombre] = useState('');
  const [fWeek, setFWeek] = useState('');
  const [fTurbidez, setFTurbidez] = useState('');
  // Checkbox states for multi-point forms
  const [termometrosData, setTermometrosData] = useState<Record<string, string>>({});
  const [purgaMenChecks, setPurgaMenChecks] = useState<Record<string, boolean>>({});
  const [aperturaAllOpen, setAperturaAllOpen] = useState(true);
  const [aperturaWeek, setAperturaWeek] = useState('1');

  // Extra data
  const [purgaSemanal, setPurgaSemanal] = useState<PurgaSemanal[]>([]);
  const [turbidezSemanal, setTurbidezSemanal] = useState<TurbidezSemanal[]>([]);
  const [apertura, setApertura] = useState<AperturaTerminal[]>([]);
  const [aperturaSemanal, setAperturaSemanal] = useState<AperturaSemanal[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(true);

  useEffect(() => {
    async function loadExtra() {
      const [{ data: ps }, { data: ts }, { data: at }] = await Promise.all([
        supabase.from('legionella_purga_semanal').select('*').order('year').order('month').order('week'),
        supabase.from('legionella_turbidez_semanal').select('*').order('year').order('month').order('week'),
        supabase.from('legionella_apertura_terminales').select('*').order('year').order('month'),
        supabase.from('legionella_apertura_semanal').select('*').order('year').order('month').order('week'),
      ]);
      if (ps) setPurgaSemanal(ps);
      if (ts) setTurbidezSemanal(ts);
      if (at) setApertura(at);
      setLoadingExtra(false);
    }
    loadExtra();
  }, []);

  if (!hasPermission('view_legionella')) return <div className="alert-banner alert-danger"><span>⛔</span> Sin permiso.</div>;
  const canEdit = hasPermission('edit_legionella');
  const legAlerts = alerts.filter(a => a.section === 'legionella' && !a.resolved);
  const currentYear = 2026;

  const last = legionellaTemps[legionellaTemps.length - 1];
  const lastBio = legionellaBiocida[legionellaBiocida.length - 1];

  const tempChartData = legionellaTemps.slice(-31).map(e => ({ date: e.date.slice(5), retorno: e.tempRetorno, dep1: e.tempDeposito1, dep2: e.tempDeposito2 }));
  const biocidaData = legionellaBiocida.slice(-31).map(e => ({ date: e.date.slice(5), biocida: e.biocida, ph: e.ph }));

  // Month filtered data
  const tempsMonth = legionellaTemps.filter(t => parseInt(t.date.slice(5,7)) === selectedMonth);
  const biocidaMonth = legionellaBiocida.filter(b => parseInt(b.date.slice(5,7)) === selectedMonth);
  const purgaSemMonth = purgaSemanal.filter(p => p.month === selectedMonth);
  const turbidezMonth = turbidezSemanal.filter(t => t.month === selectedMonth);
  const aperturaMonth = apertura.filter(a => a.month === selectedMonth);
  const aperturaSemMonth = aperturaSemanal.filter(a => a.month === selectedMonth);

  // KPIs compliance
  const semanasDone = purgaSemMonth.filter(p => p.realizada).length;
  const turbidezDone = turbidezMonth.filter(t => t.turbidez != null).length;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="card" style={{ padding: '10px 14px', fontSize: '12px' }}>
        <p style={{ margin: '0 0 6px', fontWeight: '600' }}>{label}</p>
        {payload.map((p: any) => <p key={p.name} style={{ margin: '2px 0', color: p.color }}>{p.name}: <strong>{p.value?.toFixed(2)}</strong></p>)}
      </div>
    );
  };

  // ── SAVE HANDLERS ────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      if (formType === 'temp') {
        const monthName = MONTHS[parseInt(fMonth) - 1];
        await addLegionellaTemp({
          date: fDate, month: monthName,
          tempRetorno: parseFloat(fRetorno) || 0,
          tempDeposito1: parseFloat(fDep1) || 0,
          tempDeposito2: parseFloat(fDep2) || 0,
          tempRamal1: fRamal1 ? parseFloat(fRamal1) : undefined,
          tempRamal2: fRamal2 ? parseFloat(fRamal2) : undefined,
        });
      } else if (formType === 'biocida') {
        await addLegionellaBiocida({
          date: fDate, biocida: parseFloat(fBiocida) || null,
          ph: parseFloat(fPh) || null, puntoDeMedida: fPunto, nombre: fNombre,
        });
      } else if (formType === 'purga_sem') {
        const m = parseInt(fMonth);
        const w = parseInt(fWeek);
        const id = `ps${currentYear}${m.toString().padStart(2,'0')}${w}`;
        await supabase.from('legionella_purga_semanal').upsert({ id, year: currentYear, month: m, week: w, fecha_realizacion: fDate.slice(8), nombre: fNombre || null, realizada: true });
        const { data } = await supabase.from('legionella_purga_semanal').select('*').order('year').order('month').order('week');
        if (data) setPurgaSemanal(data);
      } else if (formType === 'turbidez_sem') {
        const m = parseInt(fMonth);
        const w = parseInt(fWeek);
        const id = `ts${currentYear}${m.toString().padStart(2,'0')}${w}`;
        await supabase.from('legionella_turbidez_semanal').upsert({ id, year: currentYear, month: m, week: w, turbidez: parseFloat(fTurbidez) || null, punto_medida: fPunto || null, nombre: fNombre || null });
        const { data } = await supabase.from('legionella_turbidez_semanal').select('*').order('year').order('month').order('week');
        if (data) setTurbidezSemanal(data);
      } else if (formType === 'purga_men') {
        // Insert one row per checked point
        const checkedPoints = PURGA_MENSUAL_POINTS.filter(p => purgaMenChecks[p]);
        const rows = checkedPoints.map(p => ({
          id: `pm${Date.now()}_${p.slice(0,10).replace(/ /g,'_')}`,
          fecha: fDate, punto_terminal: p, ramal: null, nombre: fNombre || null,
        }));
        if (rows.length > 0) await supabase.from('legionella_purga_mensual').insert(rows);
        setPurgaMenChecks({});
      } else if (formType === 'termometros') {
        // Insert one row per point that has a temperature entered
        const rows = TERMOMETROS_POINTS
          .filter(p => termometrosData[p])
          .map(p => ({
            id: `tr${Date.now()}_${p.slice(0,10).replace(/ /g,'_')}_${Math.random().toString(36).slice(2,6)}`,
            fecha: fDate, punto_terminal: p,
            temperatura: parseFloat(termometrosData[p]) || null,
            nombre: fNombre || null,
          }));
        if (rows.length > 0) await supabase.from('legionella_termometros_ramal').insert(rows);
        setTermometrosData({});
      } else if (formType === 'apertura') {
        const m = parseInt(fMonth);
        const w = parseInt(aperturaWeek);
        const id = `as${currentYear}${m.toString().padStart(2,'0')}${w}`;
        await supabase.from('legionella_apertura_semanal').upsert({
          id, year: currentYear, month: m, week: w,
          todos_abiertos: aperturaAllOpen,
          fecha_realizacion: fDate || null,
          nombre: fNombre || null,
          observaciones: null,
        });
        const { data } = await supabase.from('legionella_apertura_semanal').select('*').order('year').order('month').order('week');
        if (data) setAperturaSemanal(data);
      }
      setFormOpen(false);
      resetForm();
    } catch(e) { console.error(e); alert('Error al guardar'); }
    finally { setSaving(false); }
  };

  const resetForm = () => { setFDate(new Date().toISOString().split('T')[0]); setFRetorno(''); setFDep1(''); setFDep2(''); setFRamal1(''); setFRamal2(''); setFBiocida(''); setFPh(''); setFPunto(''); setFNombre(''); setFWeek(''); setFTurbidez(''); };

  const openForm = (type: typeof formType) => { setFormType(type); setFMonth(String(selectedMonth)); setFormOpen(true); resetForm(); };

  const TAB_STYLE = (active: boolean) => ({ padding: '7px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500' as const, background: active ? '#fff' : 'transparent', color: active ? '#0f1f3d' : '#64748b', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s', whiteSpace: 'nowrap' as const });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f1f3d', margin: '0 0 4px' }}>🧫 Legionella</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Control ACS: temperaturas, biocida y pH en instalación</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => exportLegionellaPDF(selectedMonth, tempsMonth, biocidaMonth, purgaSemMonth, turbidezMonth, aperturaSemMonth)}>
            📄 Exportar PDF Sanidad
          </button>
          {canEdit && (<>
            <button className="btn btn-primary" onClick={() => openForm('temp')}>+ Temperatura</button>
            <button className="btn btn-secondary" onClick={() => openForm('biocida')}>+ Biocida/pH</button>
          </>)}
        </div>
      </div>

      {/* Alerts */}
      {legAlerts.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {legAlerts.slice(0, 3).map(a => (
            <div key={a.id} className="alert-banner alert-danger" style={{ marginBottom: '8px' }}>
              <span>🚨</span><div><strong>{a.message}</strong> — Valor: <strong>{a.value}°C</strong> (límite: {a.threshold}) · {a.timestamp}</div>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div className="metric-card" style={{ borderTop: `3px solid ${last?.tempRetorno && last.tempRetorno >= 50 ? '#22c55e' : '#ef4444'}` }}>
          <div className="metric-label">Temp. Retorno</div>
          <div className="metric-value" style={{ fontSize: '22px', color: last?.tempRetorno && last.tempRetorno >= 50 ? '#15803d' : '#dc2626' }}>{last?.tempRetorno ?? '—'}°C</div>
          <div className="metric-sub">mínimo 50°C</div>
        </div>
        <div className="metric-card" style={{ borderTop: `3px solid ${last?.tempDeposito1 && last.tempDeposito1 >= 60 ? '#22c55e' : '#ef4444'}` }}>
          <div className="metric-label">Depósito 1 (5000L)</div>
          <div className="metric-value" style={{ fontSize: '22px', color: last?.tempDeposito1 && last.tempDeposito1 >= 60 ? '#15803d' : '#dc2626' }}>{last?.tempDeposito1 ?? '—'}°C</div>
          <div className="metric-sub">mínimo 60°C</div>
        </div>
        <div className="metric-card" style={{ borderTop: `3px solid ${last?.tempDeposito2 && last.tempDeposito2 >= 60 ? '#22c55e' : '#ef4444'}` }}>
          <div className="metric-label">Depósito 2 (5000L)</div>
          <div className="metric-value" style={{ fontSize: '22px', color: last?.tempDeposito2 && last.tempDeposito2 >= 60 ? '#15803d' : '#dc2626' }}>{last?.tempDeposito2 ?? '—'}°C</div>
          <div className="metric-sub">mínimo 60°C</div>
        </div>
        <div className="metric-card" style={{ borderTop: `3px solid ${lastBio?.biocida && lastBio.biocida >= 0.2 ? '#22c55e' : '#ef4444'}` }}>
          <div className="metric-label">Biocida (Cloro)</div>
          <div className="metric-value" style={{ fontSize: '22px', color: lastBio?.biocida && lastBio.biocida >= 0.2 ? '#15803d' : '#dc2626' }}>{lastBio?.biocida?.toFixed(2) ?? '—'}</div>
          <div className="metric-sub">0.2–2.0 mg/L</div>
        </div>
        <div className="metric-card" style={{ borderTop: `3px solid ${lastBio?.ph && lastBio.ph >= 7.0 && lastBio.ph <= 8.0 ? '#22c55e' : '#ef4444'}` }}>
          <div className="metric-label">pH agua de entrada</div>
          <div className="metric-value" style={{ fontSize: '22px', color: lastBio?.ph && lastBio.ph >= 7.0 && lastBio.ph <= 8.0 ? '#15803d' : '#dc2626' }}>{lastBio?.ph?.toFixed(2) ?? '—'}</div>
          <div className="metric-sub">7.0–8.0</div>
        </div>
        <div className="metric-card" style={{ borderTop: '3px solid #0077cc' }}>
          <div className="metric-label">Purgas sem. {MONTH_SHORT[selectedMonth-1]}</div>
          <div className="metric-value" style={{ fontSize: '22px', color: semanasDone >= 4 ? '#15803d' : '#d97706' }}>{semanasDone}/5</div>
          <div className="metric-sub">semanas realizadas</div>
        </div>
      </div>

      {/* Month selector */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {MONTHS.map((m, i) => {
          const mn = i+1; const sel = mn === selectedMonth; const cur = mn === new Date().getMonth()+1;
          return <button key={mn} onClick={() => setSelectedMonth(mn)} style={{ padding: '5px 12px', borderRadius: '20px', border: `2px solid ${sel ? '#0077cc' : '#e2eaf4'}`, background: sel ? '#dbeafe' : cur ? '#f0f9ff' : '#fff', color: sel ? '#0077cc' : '#64748b', fontSize: '12px', fontWeight: sel ? '700' : '500', cursor: 'pointer' }}>{MONTH_SHORT[i]}{cur ? ' ●' : ''}</button>;
        })}
      </div>

      {/* Main tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content', flexWrap: 'wrap' }}>
        {([['temperaturas','🌡️ Temperaturas'],['biocida','🧪 Biocida/pH'],['semanales','📅 Tareas semanales'],['mensuales','📆 Tareas mensuales']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={TAB_STYLE(tab === key)}>{label}</button>
        ))}
      </div>

      {/* ── TEMPERATURAS ── */}
      {tab === 'temperaturas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Temperaturas diarias ACS (últimos 30 días)</h3>
              <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
                {[['#0077cc','Retorno'],['#7c3aed','Depósito 1'],['#0f6e56','Depósito 2']].map(([c,l]) => (
                  <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '2px', background: c, display: 'inline-block' }} />{l}</span>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={tempChartData} margin={{ top: 10, right: 80, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={35} domain={[45, 75]} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Mín. retorno 50°C', fontSize: 10, fill: '#dc2626', position: 'right' }} />
                <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Mín. depósito 60°C', fontSize: 10, fill: '#d97706', position: 'right' }} />
                <Line type="monotone" dataKey="retorno" stroke="#0077cc" dot={false} strokeWidth={2} name="Retorno (°C)" />
                <Line type="monotone" dataKey="dep1" stroke="#7c3aed" dot={false} strokeWidth={2} name="Depósito 1 (°C)" />
                <Line type="monotone" dataKey="dep2" stroke="#0f6e56" dot={false} strokeWidth={1.5} strokeDasharray="4 2" name="Depósito 2 (°C)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stats cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {(['tempRetorno','tempDeposito1','tempDeposito2'] as const).map(key => {
              const vals = legionellaTemps.slice(-30).map(e => e[key]).filter(v => v != null) as number[];
              const mn = vals.length ? Math.min(...vals) : 0, mx = vals.length ? Math.max(...vals) : 0;
              const avg = vals.length ? vals.reduce((a,b) => a+b, 0) / vals.length : 0;
              const minLimit = key === 'tempRetorno' ? 50 : 60;
              const violations = vals.filter(v => v < minLimit).length;
              return (
                <div key={key} className="card" style={{ padding: '16px' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {key === 'tempRetorno' ? 'Retorno' : key === 'tempDeposito1' ? 'Depósito 1' : 'Depósito 2'}
                  </p>
                  {[['Mínimo', mn], ['Máximo', mx], ['Promedio', avg]].map(([lbl, val]) => (
                    <div key={String(lbl)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ color: '#64748b' }}>{lbl}</span>
                      <span className={valueClass(Number(val), minLimit, 75)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{Number(val).toFixed(1)}°C</span>
                    </div>
                  ))}
                  {violations > 0 && <div style={{ marginTop: '8px', padding: '4px 8px', background: '#fef2f2', borderRadius: '4px', fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>⚠ {violations} día{violations>1?'s':''} por debajo del mínimo</div>}
                </div>
              );
            })}
          </div>

          {/* Temps table for selected month */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontSize: '13px', fontWeight: '600', color: '#0f1f3d' }}>
              Registro — {MONTHS[selectedMonth-1]}
            </div>
            <div style={{ overflowX: 'auto', maxHeight: '350px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Fecha</th><th>Tª Retorno</th><th>Depósito 1</th><th>Depósito 2</th><th>Ramal 1</th><th>Ramal 2</th></tr></thead>
                <tbody>
                  {tempsMonth.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>Sin datos para este mes</td></tr> :
                  [...tempsMonth].reverse().map(t => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: '500' }}>{t.date}</td>
                      <td className={valueClass(t.tempRetorno, 50, 65)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{t.tempRetorno?.toFixed(1) ?? '—'}°C</td>
                      <td className={valueClass(t.tempDeposito1, 60, 70)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{t.tempDeposito1?.toFixed(1) ?? '—'}°C</td>
                      <td className={valueClass(t.tempDeposito2, 60, 70)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{t.tempDeposito2?.toFixed(1) ?? '—'}°C</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{t.tempRamal1?.toFixed(1) ?? '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{t.tempRamal2?.toFixed(1) ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── BIOCIDA ── */}
      {tab === 'biocida' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600' }}>Biocida y pH agua de entrada (últimos 30 días)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={biocidaData} margin={{ top: 5, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={35} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={35} domain={[6, 9]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <ReferenceLine yAxisId="left" y={0.2} stroke="#ef4444" strokeDasharray="4 2" />
                <ReferenceLine yAxisId="left" y={2.0} stroke="#ef4444" strokeDasharray="4 2" />
                <Bar yAxisId="left" dataKey="biocida" fill="#0077cc" name="Biocida (mg/L)" radius={[2,2,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="ph" stroke="#7c3aed" dot={false} strokeWidth={2} name="pH" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontSize: '13px', fontWeight: '600', color: '#0f1f3d' }}>Registro — {MONTHS[selectedMonth-1]}</div>
            <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Fecha</th><th>Biocida (mg/L)</th><th>pH agua de entrada</th><th>Punto de medida</th><th>Responsable</th><th>Estado</th></tr></thead>
                <tbody>
                  {biocidaMonth.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>Sin datos para este mes</td></tr> :
                  [...biocidaMonth].reverse().map(e => {
                    const ok = (e.biocida != null && e.biocida >= 0.2 && e.biocida <= 2.0) && (e.ph != null && e.ph >= 7.0 && e.ph <= 8.0);
                    return (
                      <tr key={e.id}>
                        <td style={{ fontWeight: '500' }}>{e.date}</td>
                        <td className={valueClass(e.biocida, 0.2, 2.0)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{e.biocida?.toFixed(2) ?? '—'}</td>
                        <td className={valueClass(e.ph, 7.0, 8.0)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{e.ph?.toFixed(2) ?? '—'}</td>
                        <td style={{ color: '#64748b' }}>{e.puntoDeMedida}</td>
                        <td style={{ color: '#64748b' }}>{e.nombre}</td>
                        <td><span className={`badge ${ok ? 'badge-ok' : 'badge-danger'}`}>{ok ? '✓ OK' : '✗ Revisar'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── SEMANALES ── */}
      {tab === 'semanales' && (
        <div>
          {canEdit && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" onClick={() => openForm('purga_sem')}>+ Purga semanal</button>
              <button className="btn btn-secondary btn-sm" onClick={() => openForm('turbidez_sem')}>+ Turbidez semanal</button>
              <button className="btn btn-secondary btn-sm" onClick={() => openForm('apertura')}>✓ Apertura puntos terminales</button>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f1f3d', marginBottom: '12px' }}>🚿 Purga semanal acumuladores — {MONTHS[selectedMonth-1]}</h3>
              <div className="card" style={{ overflow: 'hidden' }}>
                <table className="data-table">
                  <thead><tr><th>Semana</th><th>Fecha</th><th>Responsable</th><th>Estado</th></tr></thead>
                  <tbody>
                    {[1,2,3,4,5].map(week => {
                      const r = purgaSemMonth.find(p => p.week === week);
                      return (
                        <tr key={week}>
                          <td style={{ fontWeight: '600' }}>S{week}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{r?.fecha_realizacion ? `día ${r.fecha_realizacion}` : '—'}</td>
                          <td style={{ textTransform: 'capitalize', color: '#64748b' }}>{r?.nombre ?? '—'}</td>
                          <td>{r?.realizada ? <span className="badge badge-ok">✓ Realizada</span> : <span className="badge badge-warning">Pendiente</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f1f3d', marginBottom: '12px' }}>💧 Turbidez semanal — {MONTHS[selectedMonth-1]}</h3>
              <div className="card" style={{ overflow: 'hidden' }}>
                <table className="data-table">
                  <thead><tr><th>Semana</th><th>Turbidez (UNF)</th><th>Punto</th><th>Responsable</th></tr></thead>
                  <tbody>
                    {[1,2,3,4,5].map(week => {
                      const r = turbidezMonth.find(t => t.week === week);
                      return (
                        <tr key={week}>
                          <td style={{ fontWeight: '600' }}>S{week}</td>
                          <td className={r?.turbidez != null ? (r.turbidez > 1 ? 'val-danger' : 'val-ok') : ''} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{r?.turbidez?.toFixed(2) ?? '—'}</td>
                          <td style={{ color: '#64748b', fontSize: '12px', textTransform: 'capitalize' }}>{r?.punto_medida ?? '—'}</td>
                          <td style={{ textTransform: 'capitalize', color: '#64748b' }}>{r?.nombre ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* Apertura puntos terminales - tabla resumen igual que purga y turbidez */}
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f1f3d', marginBottom: '12px' }}>🚪 Apertura puntos terminales — {MONTHS[selectedMonth-1]}</h3>
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="data-table">
                <thead><tr><th>Semana</th><th>Fecha</th><th>Responsable</th><th>Resultado</th><th>Estado</th></tr></thead>
                <tbody>
                  {[1,2,3,4,5].map(week => {
                    const r = aperturaSemMonth.find(a => a.week === week);
                    return (
                      <tr key={week}>
                        <td style={{ fontWeight: '600' }}>S{week}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{r?.fecha_realizacion ?? '—'}</td>
                        <td style={{ textTransform: 'capitalize', color: '#64748b' }}>{r?.nombre ?? '—'}</td>
                        <td>
                          {r ? (
                            r.todos_abiertos
                              ? <span style={{ fontSize: '12px', color: '#15803d', fontWeight: '600' }}>✓ Todos abiertos</span>
                              : <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>✗ No todos abiertos</span>
                          ) : <span style={{ color: '#94a3b8' }}>—</span>}
                        </td>
                        <td>{r ? <span className="badge badge-ok">✓ Registrado</span> : <span className="badge badge-warning">Pendiente</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MENSUALES ── */}
      {tab === 'mensuales' && (
        <div>
          {canEdit && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" onClick={() => openForm('purga_men')}>+ Purga tuberías</button>
              <button className="btn btn-secondary btn-sm" onClick={() => openForm('termometros')}>+ Termómetros ramal</button>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Purga mensual */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f1f3d', marginBottom: '12px' }}>🔧 Purga mensual tuberías — {MONTHS[selectedMonth-1]}</h3>
              <PurgaMensualTable month={selectedMonth} />
            </div>
            {/* Termómetros */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f1f3d', marginBottom: '12px' }}>🌡️ Termómetros por ramal — {MONTHS[selectedMonth-1]}</h3>
              <TermometrosTable month={selectedMonth} />
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL FORMULARIOS ── */}
      {formOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ padding: '28px', width: '100%', maxWidth: formType === 'termometros' || formType === 'purga_men' ? '540px' : '440px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f1f3d', margin: 0 }}>
                {formType === 'temp' ? '🌡️ Nueva temperatura ACS' :
                 formType === 'biocida' ? '🧪 Nuevo biocida / pH' :
                 formType === 'purga_sem' ? '🚿 Purga semanal acumuladores' :
                 formType === 'turbidez_sem' ? '💧 Turbidez semanal' :
                 formType === 'purga_men' ? '🔧 Purga mensual tuberías' :
                 formType === 'termometros' ? '🌡️ Termómetros por ramal' :
                 '🚪 Apertura puntos terminales'}
              </h2>
              <button onClick={() => setFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Temp ACS */}
              {formType === 'temp' && (<>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Fecha</label><input className="input-field" type="date" value={fDate} onChange={e => setFDate(e.target.value)} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Mes</label>
                    <select className="input-field" value={fMonth} onChange={e => setFMonth(e.target.value)}>{MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}</select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Tª Retorno (°C) <span style={{color:'#ef4444'}}>mín. 50°C</span></label><input className="input-field" type="number" step="0.1" placeholder="ej: 55" value={fRetorno} onChange={e => setFRetorno(e.target.value)} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Depósito 1 (°C) <span style={{color:'#ef4444'}}>mín. 60°C</span></label><input className="input-field" type="number" step="0.1" placeholder="ej: 65" value={fDep1} onChange={e => setFDep1(e.target.value)} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Depósito 2 (°C) <span style={{color:'#ef4444'}}>mín. 60°C</span></label><input className="input-field" type="number" step="0.1" placeholder="ej: 65" value={fDep2} onChange={e => setFDep2(e.target.value)} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Ramal 1 (°C) <span style={{color:'#94a3b8'}}>opcional</span></label><input className="input-field" type="number" step="0.1" placeholder="ej: 52" value={fRamal1} onChange={e => setFRamal1(e.target.value)} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Ramal 2 (°C) <span style={{color:'#94a3b8'}}>opcional</span></label><input className="input-field" type="number" step="0.1" placeholder="ej: 52" value={fRamal2} onChange={e => setFRamal2(e.target.value)} /></div>
                </div>
              </>)}

              {/* Biocida */}
              {formType === 'biocida' && (<>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Fecha</label><input className="input-field" type="date" value={fDate} onChange={e => setFDate(e.target.value)} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Biocida (mg/L) <span style={{color:'#64748b'}}>0.2–2.0</span></label><input className="input-field" type="number" step="0.01" placeholder="ej: 0.8" value={fBiocida} onChange={e => setFBiocida(e.target.value)} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>pH agua de entrada <span style={{color:'#64748b'}}>7.0–8.0</span></label><input className="input-field" type="number" step="0.01" placeholder="ej: 7.5" value={fPh} onChange={e => setFPh(e.target.value)} /></div>
                </div>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Punto de medida</label><input className="input-field" type="text" placeholder="ej: depósito 1" value={fPunto} onChange={e => setFPunto(e.target.value)} /></div>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Responsable</label><input className="input-field" type="text" placeholder="Nombre" value={fNombre} onChange={e => setFNombre(e.target.value)} /></div>
              </>)}

              {/* Purga semanal */}
              {formType === 'purga_sem' && (<>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Mes</label>
                    <select className="input-field" value={fMonth} onChange={e => setFMonth(e.target.value)}>{MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}</select></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Semana</label>
                    <select className="input-field" value={fWeek} onChange={e => setFWeek(e.target.value)}><option value="">Seleccionar...</option>{[1,2,3,4,5].map(w => <option key={w} value={w}>Semana {w}</option>)}</select></div>
                </div>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Fecha de realización</label><input className="input-field" type="date" value={fDate} onChange={e => setFDate(e.target.value)} /></div>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Responsable</label><input className="input-field" type="text" placeholder="Nombre" value={fNombre} onChange={e => setFNombre(e.target.value)} /></div>
              </>)}

              {/* Turbidez semanal */}
              {formType === 'turbidez_sem' && (<>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Mes</label>
                    <select className="input-field" value={fMonth} onChange={e => setFMonth(e.target.value)}>{MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}</select></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Semana</label>
                    <select className="input-field" value={fWeek} onChange={e => setFWeek(e.target.value)}><option value="">Seleccionar...</option>{[1,2,3,4,5].map(w => <option key={w} value={w}>Semana {w}</option>)}</select></div>
                </div>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Turbidez (UNF)</label><input className="input-field" type="number" step="0.01" placeholder="ej: 0.5" value={fTurbidez} onChange={e => setFTurbidez(e.target.value)} /></div>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Punto de medida</label><input className="input-field" type="text" placeholder="ej: Duchas 1ª planta" value={fPunto} onChange={e => setFPunto(e.target.value)} /></div>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Responsable</label><input className="input-field" type="text" placeholder="Nombre" value={fNombre} onChange={e => setFNombre(e.target.value)} /></div>
              </>)}

              {/* Purga mensual tuberías — CHECKBOXES */}
              {formType === 'purga_men' && (<>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Fecha</label><input className="input-field" type="date" value={fDate} onChange={e => setFDate(e.target.value)} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Responsable</label><input className="input-field" type="text" placeholder="Nombre" value={fNombre} onChange={e => setFNombre(e.target.value)} /></div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Puntos terminales purgados</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {PURGA_MENSUAL_POINTS.map(p => (
                      <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: purgaMenChecks[p] ? '#eff6ff' : '#f8fafc', borderRadius: '8px', border: `1px solid ${purgaMenChecks[p] ? '#bfdbfe' : '#e2e8f0'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                        <input type="checkbox" checked={!!purgaMenChecks[p]} onChange={e => setPurgaMenChecks(prev => ({ ...prev, [p]: e.target.checked }))}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0077cc' }} />
                        <span style={{ fontSize: '13px', fontWeight: purgaMenChecks[p] ? '600' : '400', color: purgaMenChecks[p] ? '#0f1f3d' : '#475569', textTransform: 'capitalize' }}>{p}</span>
                        {purgaMenChecks[p] && <span style={{ marginLeft: 'auto', color: '#15803d', fontSize: '14px' }}>✓</span>}
                      </label>
                    ))}
                  </div>
                  <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => setPurgaMenChecks(Object.fromEntries(PURGA_MENSUAL_POINTS.map(p => [p, true])))}
                      style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#0077cc', fontWeight: '600' }}>
                      ✓ Seleccionar todos
                    </button>
                    <button type="button" onClick={() => setPurgaMenChecks({})}
                      style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#64748b' }}>
                      Limpiar
                    </button>
                  </div>
                </div>
              </>)}

              {/* Termómetros ramal — un input por punto */}
              {formType === 'termometros' && (<>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Fecha</label><input className="input-field" type="date" value={fDate} onChange={e => setFDate(e.target.value)} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Responsable</label><input className="input-field" type="text" placeholder="Nombre" value={fNombre} onChange={e => setFNombre(e.target.value)} /></div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Temperatura por punto (°C) <span style={{ color: '#ef4444' }}>mín. 50°C</span></label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {TERMOMETROS_POINTS.map(p => {
                      const val = termometrosData[p] || '';
                      const numVal = parseFloat(val);
                      const isLow = val && numVal < 50;
                      return (
                        <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: isLow ? '#fef2f2' : '#f8fafc', borderRadius: '8px', border: `1px solid ${isLow ? '#fecaca' : '#e2e8f0'}` }}>
                          <span style={{ flex: 1, fontSize: '13px', textTransform: 'capitalize', color: '#334155' }}>{p}</span>
                          <input type="number" step="0.1" placeholder="—" value={val}
                            onChange={e => setTermometrosData(prev => ({ ...prev, [p]: e.target.value }))}
                            style={{ width: '80px', padding: '5px 8px', borderRadius: '6px', border: `1px solid ${isLow ? '#fca5a5' : '#e2e8f0'}`, fontSize: '13px', fontFamily: 'var(--font-mono)', textAlign: 'center', background: isLow ? '#fff' : '#fff', outline: 'none' }} />
                          <span style={{ fontSize: '11px', color: '#94a3b8', width: '20px' }}>°C</span>
                          {isLow && <span title="Por debajo del mínimo">🚨</span>}
                          {val && !isLow && <span style={{ color: '#15803d' }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>)}

              {/* Apertura puntos terminales */}
              {formType === 'apertura' && (<>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Mes</label>
                    <select className="input-field" value={fMonth} onChange={e => setFMonth(e.target.value)}>{MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}</select></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Semana</label>
                    <select className="input-field" value={aperturaWeek} onChange={e => setAperturaWeek(e.target.value)}>{[1,2,3,4,5].map(w => <option key={w} value={w}>Semana {w}</option>)}</select></div>
                </div>
                <div style={{ padding: '16px', background: aperturaAllOpen ? '#eff6ff' : '#fef2f2', borderRadius: '10px', border: `1px solid ${aperturaAllOpen ? '#bfdbfe' : '#fecaca'}` }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={aperturaAllOpen} onChange={e => setAperturaAllOpen(e.target.checked)}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#0077cc' }} />
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f1f3d', display: 'block' }}>
                        {aperturaAllOpen ? '✅ Se han abierto todos los puntos terminales' : '⚠️ No se han abierto todos los puntos terminales'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Semana {aperturaWeek} de {MONTHS[parseInt(fMonth)-1]} — Marca si se han abierto manualmente todos los terminales no utilizados
                      </span>
                    </div>
                  </label>
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Al guardar, se actualizará el registro de todos los {aperturaMonth.length} puntos terminales de este mes con el resultado de la semana {aperturaWeek}.
                </p>
              </>)}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components that load their own data to avoid the main component getting too complex
function PurgaMensualTable({ month }: { month: number }) {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('legionella_purga_mensual').select('*').order('fecha').then(({ data }) => { if (data) setData(data); });
  }, []);
  const filtered = data.filter(p => parseInt(p.fecha.slice(5,7)) === month);
  if (filtered.length === 0) return <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Sin registros este mes</div>;
  // Group by fecha
  const byFecha: Record<string, typeof filtered> = {};
  for (const p of filtered) { if (!byFecha[p.fecha]) byFecha[p.fecha] = []; byFecha[p.fecha].push(p); }
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {Object.entries(byFecha).map(([fecha, rows]) => (
        <div key={fecha}>
          <div style={{ padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontSize: '12px', fontWeight: '700', color: '#0077cc' }}>
            📅 {fecha} — {rows[0]?.nombre ?? '—'}
          </div>
          {rows.map(p => (
            <div key={p.id} style={{ padding: '8px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <span className="badge badge-ok" style={{ fontSize: '10px', flex: 'none' }}>✓</span>
              <span style={{ textTransform: 'capitalize' }}>{p.punto_terminal}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function TermometrosTable({ month }: { month: number }) {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('legionella_termometros_ramal').select('*').order('fecha').then(({ data }) => { if (data) setData(data); });
  }, []);
  const filtered = data.filter(t => parseInt(t.fecha.slice(5,7)) === month);
  if (filtered.length === 0) return <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Sin registros este mes</div>;
  const byFecha: Record<string, typeof filtered> = {};
  for (const t of filtered) { if (!byFecha[t.fecha]) byFecha[t.fecha] = []; byFecha[t.fecha].push(t); }
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {Object.entries(byFecha).map(([fecha, rows]) => (
        <div key={fecha}>
          <div style={{ padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontSize: '12px', fontWeight: '700', color: '#c2410c' }}>
            📅 {fecha} — {rows[0]?.nombre ?? '—'}
          </div>
          {rows.map(t => {
            const ok = t.temperatura != null && t.temperatura >= 50;
            return (
              <div key={t.id} style={{ padding: '8px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <span className={`badge ${ok ? 'badge-ok' : 'badge-danger'}`} style={{ fontSize: '10px', flex: 'none' }}>{t.temperatura?.toFixed(1)}°C</span>
                <span style={{ textTransform: 'capitalize', flex: 1 }}>{t.punto_terminal}</span>
                {!ok && <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: '600' }}>⚠ Bajo mínimo</span>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
