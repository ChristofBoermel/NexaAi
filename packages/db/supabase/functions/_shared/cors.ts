// Shared CORS-Headers fuer alle Functions.
// Import aus jeder Function via: import { corsHeaders } from '../_shared/cors.ts'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}
