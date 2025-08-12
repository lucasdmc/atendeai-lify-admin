# Guia rápido: aplicar migrations e seeds no Supabase

## Pré-requisitos
- Acesso ao Supabase (projeto e credenciais)
- Supabase CLI (opcional) ou acesso ao SQL editor do dashboard

## Aplicar migrations
1. Abra o SQL editor do Supabase (projeto alvo)
2. Cole o conteúdo do arquivo e execute:
   - `supabase/migrations/20250701090000_create_routing_flow_calendar_tables.sql`
3. Verifique se as tabelas foram criadas:
   - `clinic_whatsapp_numbers`
   - `conversation_flows`
   - `google_calendar_tokens_by_clinic`

## Popular clinic_whatsapp_numbers

Se você já tem a coluna `whatsapp_phone` em `clinics`, você pode importar o `phone_number_id` obtido na Meta. Exemplo de insert:

```sql
insert into public.clinic_whatsapp_numbers (clinic_id, phone_number_id, display_phone_number)
values
  ('<CLINIC_UUID>', '<META_PHONE_NUMBER_ID>', '+55XXXXXXXXXXX');
```

Para múltiplas clínicas, repita a operação para cada uma. Garanta unicidade em `phone_number_id`.

## Tokens do Google Calendar por clínica
- Para OAuth2: após obter o `code` no callback, chame a rota do backend que usa `GoogleCalendarService.processAuthCode(code, clinicId)`. Isso vai gravar os tokens em `google_calendar_tokens_by_clinic`.
- Para Service Account: garanta o `google-credentials.json` no ambiente de execução e a permissão de acesso ao calendário.

## Verificação pós-migration
- `select * from public.clinic_whatsapp_numbers limit 5;`
- `select * from public.google_calendar_tokens_by_clinic limit 5;`
- `select * from public.conversation_flows limit 5;`

Se precisar, posso preparar um script SQL de seed para múltiplas clínicas a partir de uma lista (CSV).
