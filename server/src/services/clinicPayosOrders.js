async function requestSupabase(path, options = {}, accessToken) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase payment storage is not configured.');
  const response = await fetch(url + path, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${accessToken || key}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = new Error('Supabase payment request failed.');
    error.status = response.status;
    throw error;
  }
  if (response.status !== 204 && options.headers?.Prefer !== 'return=minimal') return response.json();
}

async function getPatient(accessToken) {
  if (!accessToken) return null;
  try {
    const user = await requestSupabase('/auth/v1/user', {}, accessToken);
    const profiles = await requestSupabase(
      '/rest/v1/clinic_profiles?select=role&id=eq.' + encodeURIComponent(user.id)
    );
    return profiles[0]?.role === 'patient' ? user.id : null;
  } catch (error) {
    if (error.status === 401 || error.status === 403) return null;
    throw error;
  }
}

async function getDoctorFee(doctorId) {
  const doctors = await requestSupabase(
    '/rest/v1/clinic_doctors?select=fee_vnd&active=eq.true&id=eq.' + encodeURIComponent(doctorId)
  );
  return doctors[0]?.fee_vnd;
}

async function isSlotAvailable(doctorId, startsAt, accessToken) {
  const startsAtMs = Date.parse(startsAt);
  const localDate = new Date(startsAtMs + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const slots = await requestSupabase('/rest/v1/rpc/clinic_slot_availability', {
    method: 'POST',
    body: JSON.stringify({ p_doctor_id: doctorId, p_date: localDate }),
  }, accessToken);
  return slots.some(slot => !slot.is_booked && Date.parse(slot.starts_at) === startsAtMs);
}

function createOrder(order) {
  return requestSupabase('/rest/v1/clinic_payos_orders', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(order),
  });
}

async function getOrder(orderCode) {
  const orders = await requestSupabase(
    '/rest/v1/clinic_payos_orders?select=order_code,patient_id,amount,paid_at&order_code=eq.' + orderCode
  );
  return orders[0];
}

async function markPaid(orderCode) {
  const rows = await requestSupabase(
    '/rest/v1/clinic_payos_orders?order_code=eq.' + orderCode + '&paid_at=is.null',
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ paid_at: new Date().toISOString() }),
    }
  );
  return rows[0]?.paid_at ?? (await getOrder(orderCode))?.paid_at;
}

module.exports = { getPatient, getDoctorFee, isSlotAvailable, createOrder, getOrder, markPaid };
