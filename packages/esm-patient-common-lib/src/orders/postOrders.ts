import { openmrsFetch } from '@openmrs/esm-framework';
import { getPatientUuidFromUrl } from '../get-patient-uuid-from-url';
import { OrderBasketStore, orderBasketStore } from './store';
import { OrderBasketItem, OrderPost } from './types';

export async function postOrders(encounterUuid: string, abortController: AbortController) {
  const patientUuid = getPatientUuidFromUrl();
  const { items, postDataPrepFunctions }: OrderBasketStore = orderBasketStore.getState();
  const patientItems = items[patientUuid];

  const erroredItems: Array<OrderBasketItem> = [];
  for (let grouping in patientItems) {
    const orders = patientItems[grouping];
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const dto = postDataPrepFunctions[grouping](order, patientUuid, encounterUuid);
      await postOrder(dto, abortController).catch((error) => {
        erroredItems.push({
          ...order,
          orderError: error,
        });
      });
    }
  }
  return erroredItems;
}

function postOrder(body: OrderPost, abortController?: AbortController) {
  return openmrsFetch(`/ws/rest/v1/order`, {
    method: 'POST',
    signal: abortController?.signal,
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}
