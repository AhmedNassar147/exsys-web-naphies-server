/*
 *
 * `checkMedicationWithPbm`: `middleware`
 *
 */
import axios from "axios";
import createBaseExpressMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";

// result file => results\pbm.json

const makeWaseelRequest = async (apiId, auth, data) => {
  try {
    const response = await axios.post(
      `https://portal.waseel.com/WaseelSwitch/providers/pbm/${apiId}`,
      data,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      },
    );

    return { result: response.data };
  } catch (error) {
    return {
      error: error.response?.data || error?.message || String(error),
    };
  }
};

const validatePbmData = async (pbmData) => {
  const { user_name, password, ...otherPbmData } = pbmData;
  const { providerId, payerId, dateOfService, services = [] } = otherPbmData;

  // Node.js Base64 encoding
  const auth = Buffer.from(`${user_name}:${password}`).toString("base64");

  const { error: validationError, result: validationResult } =
    await makeWaseelRequest("validate", auth, otherPbmData);

  // Keep original field name you had (typo) but fix logic
  let sugeestionError = null;
  let suggestionResult = null;

  // Normalize validation result + attach request_detail_no by index
  const _validationResult =
    validationResult && Array.isArray(validationResult.results)
      ? {
          ...validationResult,
          results: validationResult.results.map((item, index) => ({
            ...item,
            extendable: "Y",
            request_detail_no: services[index]?.request_detail_no || "",
          })),
        }
      : validationResult;

  // Only call suggestions if validation succeeded and we have results array to enrich
  if (
    !validationError &&
    _validationResult &&
    Array.isArray(_validationResult.results)
  ) {
    const requestData = {
      payerId,
      providerId,
      validationType: "DIAGNOSIS_INDICATION",
      dateOfService: (dateOfService || "").split("-").reverse().join("/"),
      drugList: services,
    };

    const { error, result } = await makeWaseelRequest(
      "icd-suggestion",
      auth,
      requestData,
    );

    sugeestionError = error || null;
    suggestionResult = Array.isArray(result) ? result : null;

    if (Array.isArray(suggestionResult) && suggestionResult.length) {
      _validationResult.results = _validationResult.results.map((item) => {
        if (!item?.serviceCode) return item;

        const foundSuggestion = suggestionResult.find(
          (s) => s?.serviceCode === item.serviceCode,
        );

        return foundSuggestion
          ? { ...item, suggestion: foundSuggestion }
          : item;
      });
    }
  }

  return {
    validationError,
    validationResult: _validationResult,
    sugeestionError,
    suggestionResult,
  };
};

export default createBaseExpressMiddleware(
  async (data) => await validatePbmData(data),
);

// {
//   "validationResult": {
//     "clientRequestId": "2388266_317301",
//     "requestId": "45d781ed-7365-4efc-9e88-5356612f5f1d",
//     "status": "PARTIAL_APPROVED",
//     "errors": [
//       "Medication 0606245396 is not indicated with diagnosis code K76.9",
//       "Medication 0606245396 is not indicated with diagnosis code I10",
//       "Medication 0606245396 is not indicated with diagnosis code R53",
//       "Medication 0606245396 is not indicated with diagnosis code E78.2",
//       "Medication 0606245396 is not indicated with diagnosis code E11.69",
//       "Medication 1611211330 is not indicated with diagnosis code K76.9",
//       "Medication 1611211330 is not indicated with diagnosis code I10",
//       "Medication 1611211330 is not indicated with diagnosis code R53",
//       "Medication 1611211330 is not indicated with diagnosis code E78.2",
//       "Medication 1611211330 is not indicated with diagnosis code E11.69",
//       "Drug Not Found For Code : 9-114-08"
//     ],
//     "results": [
//       {
//         "serviceCode": "0203233315",
//         "serviceDescription": "Lunia 20/10 Mg 28 Tab",
//         "requestedQuantity": "3",
//         "amount": "0.0",
//         "daysOfSupply": "90",
//         "status": "APPROVED",
//         "request_detail_no": 27015423,
//         "suggestion": {
//           "serviceCode": "0203233315",
//           "scientificCode": "14000001650-30-100000073664",
//           "suggestedIcds": [
//             {
//               "icdCode": "E75",
//               "icdCodeDescription": "Disorders of sphingolipid metabolism and other lipid storage disorders"
//             },
//             {
//               "icdCode": "E78",
//               "icdCodeDescription": "Disorders of lipoprotein metabolism and other lipidaemias"
//             },
//             {
//               "icdCode": "E13.29",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified renal complication"
//             },
//             {
//               "icdCode": "E11.81",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with unspecified complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.80",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with unspecified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.20",
//               "icdCodeDescription": "Other specified diabetes mellitus with renal complication, unspecified"
//             },
//             {
//               "icdCode": "E13.21",
//               "icdCodeDescription": "Other specified diabetes mellitus with incipient diabetic nephropathy"
//             },
//             {
//               "icdCode": "E13.22",
//               "icdCodeDescription": "Other specified diabetes mellitus with established diabetic nephropathy"
//             },
//             {
//               "icdCode": "E13.23",
//               "icdCodeDescription": "Other specified diabetes mellitus with advanced renal disease"
//             },
//             {
//               "icdCode": "I71.8",
//               "icdCodeDescription": "Aortic aneurysm of unspecified site, ruptured"
//             },
//             {
//               "icdCode": "I71.9",
//               "icdCodeDescription": "Aortic aneurysm of unspecified site, without mention of rupture"
//             },
//             {
//               "icdCode": "I71.6",
//               "icdCodeDescription": "Thoracoabdominal aortic aneurysm, without mention of rupture"
//             },
//             {
//               "icdCode": "I71.4",
//               "icdCodeDescription": "Abdominal aortic aneurysm, without mention of rupture"
//             },
//             {
//               "icdCode": "I71.5",
//               "icdCodeDescription": "Thoracoabdominal aortic aneurysm, ruptured"
//             },
//             {
//               "icdCode": "E11.90",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus without complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "I71.2",
//               "icdCodeDescription": "Thoracic aortic aneurysm, without mention of rupture"
//             },
//             {
//               "icdCode": "I71.3",
//               "icdCodeDescription": "Abdominal aortic aneurysm, ruptured"
//             },
//             {
//               "icdCode": "I71.0",
//               "icdCodeDescription": "Dissection of aorta"
//             },
//             {
//               "icdCode": "I71.1",
//               "icdCodeDescription": "Thoracic aortic aneurysm, ruptured"
//             },
//             {
//               "icdCode": "E13.35",
//               "icdCodeDescription": "Other specified diabetes mellitus with advanced ophthalmic disease"
//             },
//             {
//               "icdCode": "E13.36",
//               "icdCodeDescription": "Other specified diabetes mellitus with diabetic cataract"
//             },
//             {
//               "icdCode": "E11.1",
//               "icdCodeDescription": "Type 2 diabetes mellitus with acidosis"
//             },
//             {
//               "icdCode": "E13.39",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified ophthalmic complication"
//             },
//             {
//               "icdCode": "E11.0",
//               "icdCodeDescription": "Type 2 diabetes mellitus with hyperosmolarity"
//             },
//             {
//               "icdCode": "E11.91",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus without complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.5",
//               "icdCodeDescription": "Type 2 diabetes mellitus with circulatory complciation"
//             },
//             {
//               "icdCode": "E11.4",
//               "icdCodeDescription": "Type 2 diabetes mellitus with neurological complication"
//             },
//             {
//               "icdCode": "E11.3",
//               "icdCodeDescription": "Type 2 diabetes mellitus with ophthalmic complication"
//             },
//             {
//               "icdCode": "E11.2",
//               "icdCodeDescription": "Type 2 diabetes mellitus with renal complication"
//             },
//             {
//               "icdCode": "E13.30",
//               "icdCodeDescription": "Other specified diabetes mellitus with ophthalmic complication, unspecified"
//             },
//             {
//               "icdCode": "E11.9",
//               "icdCodeDescription": "Type 2 diabetes mellitus without complication"
//             },
//             {
//               "icdCode": "E13.31",
//               "icdCodeDescription": "Other specified diabetes mellitus with background retinopathy"
//             },
//             {
//               "icdCode": "E14.00",
//               "icdCodeDescription": "Unspecified diabetes mellitus with coma, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.8",
//               "icdCodeDescription": "Type 2 diabetes mellitus with unspecified complication"
//             },
//             {
//               "icdCode": "E13.32",
//               "icdCodeDescription": "Other specified diabetes mellitus with preproliferative retinopathy"
//             },
//             {
//               "icdCode": "E11.7",
//               "icdCodeDescription": "Type 2 diabetes mellitus with multiple complications"
//             },
//             {
//               "icdCode": "E13.33",
//               "icdCodeDescription": "Other specified diabetes mellitus with proliferative retinopathy"
//             },
//             {
//               "icdCode": "E14.02",
//               "icdCodeDescription": "Unspecified diabetes mellitus with hyperosmolarity, with coma"
//             },
//             {
//               "icdCode": "I21.9",
//               "icdCodeDescription": "Acute myocardial infarction, unspecified"
//             },
//             {
//               "icdCode": "E11.6",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "E13.34",
//               "icdCodeDescription": "Other specified diabetes mellitus with other retinopathy"
//             },
//             {
//               "icdCode": "E14.01",
//               "icdCodeDescription": "Unspecified diabetes mellitus with hyperosmolarity, without nonketotic hyperglycaemic-hyperosmolar coma [NKHHC]"
//             },
//             {
//               "icdCode": "I21.3",
//               "icdCodeDescription": "Acute transmural myocardial infarction of unspecified site"
//             },
//             {
//               "icdCode": "I21.4",
//               "icdCodeDescription": "Acute subendocardial myocardial infarction"
//             },
//             {
//               "icdCode": "I82.8",
//               "icdCodeDescription": "Embolism and thrombosis of other specified veins"
//             },
//             {
//               "icdCode": "I82.9",
//               "icdCodeDescription": "Embolism and thrombosis of unspecified vein"
//             },
//             {
//               "icdCode": "I67.2",
//               "icdCodeDescription": "Cerebral atherosclerosis"
//             },
//             {
//               "icdCode": "I21.0",
//               "icdCodeDescription": "Acute transmural myocardial infarction of anterior wall"
//             },
//             {
//               "icdCode": "I21.1",
//               "icdCodeDescription": "Acute transmural myocardial infarction of inferior wall"
//             },
//             {
//               "icdCode": "I21.2",
//               "icdCodeDescription": "Acute transmural myocardial infarction of other sites"
//             },
//             {
//               "icdCode": "I82.2",
//               "icdCodeDescription": "Embolism and thrombosis of vena cava"
//             },
//             {
//               "icdCode": "I82.3",
//               "icdCodeDescription": "Embolism and thrombosis of renal vein"
//             },
//             {
//               "icdCode": "I82.1",
//               "icdCodeDescription": "Thrombophlebitis migrans"
//             },
//             {
//               "icdCode": "E14.15",
//               "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, with lactic acidosis, without coma"
//             },
//             {
//               "icdCode": "E14.14",
//               "icdCodeDescription": "Unspecified diabetes mellitus with lactic acidosis, with coma"
//             },
//             {
//               "icdCode": "E13.49",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified neurological complication"
//             },
//             {
//               "icdCode": "E14.16",
//               "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, with lactic acidosis, with coma"
//             },
//             {
//               "icdCode": "I25.13",
//               "icdCodeDescription": "Atherosclerotic heart disease, of nonautologous bypass graft"
//             },
//             {
//               "icdCode": "I25.12",
//               "icdCodeDescription": "Atherosclerotic heart disease, of autologous bypass graft"
//             },
//             {
//               "icdCode": "E13.40",
//               "icdCodeDescription": "Other specified diabetes mellitus with unspecified neuropathy"
//             },
//             {
//               "icdCode": "I25.11",
//               "icdCodeDescription": "Atherosclerotic heart disease, of native coronary artery"
//             },
//             {
//               "icdCode": "E13.41",
//               "icdCodeDescription": "Other specified diabetes mellitus with diabetic mononeuropathy"
//             },
//             {
//               "icdCode": "I25.10",
//               "icdCodeDescription": "Atherosclerotic heart disease, of unspecified vessel"
//             },
//             {
//               "icdCode": "E13.42",
//               "icdCodeDescription": "Other specified diabetes mellitus with diabetic polyneuropathy"
//             },
//             {
//               "icdCode": "E14.11",
//               "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, without coma"
//             },
//             {
//               "icdCode": "E13.43",
//               "icdCodeDescription": "Other specified diabetes mellitus with diabetic autonomic neuropathy"
//             },
//             {
//               "icdCode": "E14.10",
//               "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "I78.8",
//               "icdCodeDescription": "Other diseases of capillaries"
//             },
//             {
//               "icdCode": "E14.13",
//               "icdCodeDescription": "Unspecified diabetes mellitus with lactic acidosis, without coma"
//             },
//             {
//               "icdCode": "E14.12",
//               "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, with coma"
//             },
//             {
//               "icdCode": "I70.9",
//               "icdCodeDescription": "Generalised and unspecified atherosclerosis"
//             },
//             {
//               "icdCode": "I78.0",
//               "icdCodeDescription": "Hereditary haemorrhagic telangiectasia"
//             },
//             {
//               "icdCode": "Z95.1",
//               "icdCodeDescription": "Presence of aortocoronary bypass graft"
//             },
//             {
//               "icdCode": "Z95.0",
//               "icdCodeDescription": "Presence of cardiac device"
//             },
//             {
//               "icdCode": "I70.1",
//               "icdCodeDescription": "Atherosclerosis of renal artery"
//             },
//             {
//               "icdCode": "I70.2",
//               "icdCodeDescription": "Atherosclerosis of arteries of extremities"
//             },
//             {
//               "icdCode": "I70.0",
//               "icdCodeDescription": "Atherosclerosis of aorta"
//             },
//             {
//               "icdCode": "E13.59",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified circulatory complication"
//             },
//             {
//               "icdCode": "E14.29",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified renal complication"
//             },
//             {
//               "icdCode": "I21",
//               "icdCodeDescription": "Acute myocardial infarction"
//             },
//             {
//               "icdCode": "I20",
//               "icdCodeDescription": "Angina pectoris"
//             },
//             {
//               "icdCode": "I23",
//               "icdCodeDescription": "Certain current complications following acute myocardial infarction"
//             },
//             {
//               "icdCode": "E13.50",
//               "icdCodeDescription": "Other specified diabetes mellitus with circulatory complication, unspecified"
//             },
//             {
//               "icdCode": "I22",
//               "icdCodeDescription": "Subsequent myocardial infarction"
//             },
//             {
//               "icdCode": "E13.51",
//               "icdCodeDescription": "Other specified diabetes mellitus with peripheral angiopathy without gangrene"
//             },
//             {
//               "icdCode": "E14.20",
//               "icdCodeDescription": "Unspecified diabetes mellitus with renal complication, unspecified"
//             },
//             {
//               "icdCode": "I25",
//               "icdCodeDescription": "Chronic ischaemic heart disease"
//             },
//             {
//               "icdCode": "E13.52",
//               "icdCodeDescription": "Other specified diabetes mellitus with peripheral angiopathy with gangrene"
//             },
//             {
//               "icdCode": "I24",
//               "icdCodeDescription": "Other acute ischaemic heart diseases"
//             },
//             {
//               "icdCode": "E13.53",
//               "icdCodeDescription": "Other specified diabetes mellitus with diabetic ischaemic cardiomyopathy"
//             },
//             {
//               "icdCode": "E14.22",
//               "icdCodeDescription": "Unspecified diabetes mellitus with established diabetic nephropathy"
//             },
//             {
//               "icdCode": "I20.8",
//               "icdCodeDescription": "Other forms of angina pectoris"
//             },
//             {
//               "icdCode": "E14.21",
//               "icdCodeDescription": "Unspecified diabetes mellitus with incipient diabetic nephropathy"
//             },
//             {
//               "icdCode": "I20.9",
//               "icdCodeDescription": "Angina pectoris, unspecified"
//             },
//             {
//               "icdCode": "E14.23",
//               "icdCodeDescription": "Unspecified diabetes mellitus with advanced renal disease"
//             },
//             {
//               "icdCode": "I20.0",
//               "icdCodeDescription": "Unstable angina"
//             },
//             {
//               "icdCode": "I20.1",
//               "icdCodeDescription": "Angina pectoris with documented spasm"
//             },
//             {
//               "icdCode": "I73.00",
//               "icdCodeDescription": "Raynaud's syndrome without gangrene"
//             },
//             {
//               "icdCode": "I73.01",
//               "icdCodeDescription": "Raynaud's syndrome with gangrene"
//             },
//             {
//               "icdCode": "E11.43",
//               "icdCodeDescription": "Type 2 diabetes mellitus with diabetic autonomic neuropathy"
//             },
//             {
//               "icdCode": "E11.42",
//               "icdCodeDescription": "Type 2 diabetes mellitus with diabetic polyneuropathy"
//             },
//             {
//               "icdCode": "E10.73",
//               "icdCodeDescription": "Type 1 diabetes mellitus with foot ulcer due to multiple causes"
//             },
//             {
//               "icdCode": "E11.41",
//               "icdCodeDescription": "Type 2 diabetes mellitus with diabetic mononeuropathy"
//             },
//             {
//               "icdCode": "E11.40",
//               "icdCodeDescription": "Type 2 diabetes mellitus with unspecified neuropathy"
//             },
//             {
//               "icdCode": "E10.71",
//               "icdCodeDescription": "Type 1 diabetes mellitus with multiple microvascular complications"
//             },
//             {
//               "icdCode": "E10.70",
//               "icdCodeDescription": "Insulin-dependent diabetes mellitus with multiple complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.49",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other specified neurological complication"
//             },
//             {
//               "icdCode": "E11.53",
//               "icdCodeDescription": "Type 2 diabetes mellitus with diabetic ischaemic cardiomyopathy"
//             },
//             {
//               "icdCode": "E11.52",
//               "icdCodeDescription": "Type 2 diabetes mellitus with peripheral angiopathy with gangrene"
//             },
//             {
//               "icdCode": "I71.03",
//               "icdCodeDescription": "Dissection of thoracoabdominal aorta"
//             },
//             {
//               "icdCode": "E11.51",
//               "icdCodeDescription": "Type 2 diabetes mellitus with peripheral angiopathy without gangrene"
//             },
//             {
//               "icdCode": "I71.02",
//               "icdCodeDescription": "Dissection of abdominal aorta"
//             },
//             {
//               "icdCode": "E11.50",
//               "icdCodeDescription": "Type 2 diabetes mellitus with circulatory complication, unspecified"
//             },
//             {
//               "icdCode": "I71.01",
//               "icdCodeDescription": "Dissection of thoracic aorta"
//             },
//             {
//               "icdCode": "E10.81",
//               "icdCodeDescription": "Insulin-dependent diabetes mellitus with unspecified complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "I71.00",
//               "icdCodeDescription": "Dissection of aorta, unspecified site"
//             },
//             {
//               "icdCode": "E10.80",
//               "icdCodeDescription": "Insulin-dependent diabetes mellitus with unspecified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.3",
//               "icdCodeDescription": "Other specified diabetes mellitus with ophthalmic complication"
//             },
//             {
//               "icdCode": "E13.2",
//               "icdCodeDescription": "Other specified diabetes mellitus with renal complication"
//             },
//             {
//               "icdCode": "E13.1",
//               "icdCodeDescription": "Other specified diabetes mellitus with acidosis"
//             },
//             {
//               "icdCode": "E11.59",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other specified circulatory complication"
//             },
//             {
//               "icdCode": "E13.0",
//               "icdCodeDescription": "Other specified diabetes mellitus with hyperosmolarity"
//             },
//             {
//               "icdCode": "E13.7",
//               "icdCodeDescription": "Other specified diabetes mellitus with multiple complications"
//             },
//             {
//               "icdCode": "E13.6",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "G46.3",
//               "icdCodeDescription": "Brain stem stroke syndrome (I60-I67+)"
//             },
//             {
//               "icdCode": "E13.5",
//               "icdCodeDescription": "Other specified diabetes mellitus with circulatory complication"
//             },
//             {
//               "icdCode": "G46.4",
//               "icdCodeDescription": "Cerebellar stroke syndrome (I60-I67+)"
//             },
//             {
//               "icdCode": "E13.4",
//               "icdCodeDescription": "Other specified diabetes mellitus with neurological complication"
//             },
//             {
//               "icdCode": "E13.9",
//               "icdCodeDescription": "Other specified diabetes mellitus without complication"
//             },
//             {
//               "icdCode": "E13.8",
//               "icdCodeDescription": "Other specified diabetes mellitus with unspecified complication"
//             },
//             {
//               "icdCode": "E11.65",
//               "icdCodeDescription": "Type 2 diabetes mellitus with poor control"
//             },
//             {
//               "icdCode": "E13.02",
//               "icdCodeDescription": "Other specified diabetes mellitus with hyperosmolarity, with coma"
//             },
//             {
//               "icdCode": "E11.64",
//               "icdCodeDescription": "Type 2 diabetes mellitus with hypoglycaemia"
//             },
//             {
//               "icdCode": "E11.63",
//               "icdCodeDescription": "Type 2 diabetes mellitus with specified periodontal complication"
//             },
//             {
//               "icdCode": "I50",
//               "icdCodeDescription": "Heart failure"
//             },
//             {
//               "icdCode": "E11.62",
//               "icdCodeDescription": "Type 2 diabetes mellitus with specified skin and subcutaneous tissue complication"
//             },
//             {
//               "icdCode": "E11.61",
//               "icdCodeDescription": "Type 2 diabetes mellitus with specified diabetic musculoskeletal and connective tissue complication"
//             },
//             {
//               "icdCode": "I52",
//               "icdCodeDescription": "Other heart disorders in diseases classified elsewhere"
//             },
//             {
//               "icdCode": "E11.60",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with other specified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E10.91",
//               "icdCodeDescription": "Insulin-dependent diabetes mellitus without complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E10.90",
//               "icdCodeDescription": "Insulin-dependent diabetes mellitus without complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.69",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "E13.00",
//               "icdCodeDescription": "Other specified diabetes mellitus with coma, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.01",
//               "icdCodeDescription": "Other specified diabetes mellitus with hyperosmolarity, without nonketotic hyperglycaemic-hyperosmolar coma [NKHHC]"
//             },
//             {
//               "icdCode": "E13.13",
//               "icdCodeDescription": "Other specified diabetes mellitus with lactic acidosis, without coma"
//             },
//             {
//               "icdCode": "E13.14",
//               "icdCodeDescription": "Other specified diabetes mellitus with lactic acidosis, with coma"
//             },
//             {
//               "icdCode": "E75.3",
//               "icdCodeDescription": "Sphingolipidosis, unspecified"
//             },
//             {
//               "icdCode": "E13.15",
//               "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, with lactic acidosis, without coma"
//             },
//             {
//               "icdCode": "E75.0",
//               "icdCodeDescription": "GM2 gangliosidosis"
//             },
//             {
//               "icdCode": "E11.73",
//               "icdCodeDescription": "Type 2 diabetes mellitus with foot ulcer due to multiple causes"
//             },
//             {
//               "icdCode": "E13.16",
//               "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, with lactic acidosis, with coma"
//             },
//             {
//               "icdCode": "E75.1",
//               "icdCodeDescription": "Other gangliosidosis"
//             },
//             {
//               "icdCode": "E11.72",
//               "icdCodeDescription": "Type 2 diabetes mellitus with features of insulin resistance"
//             },
//             {
//               "icdCode": "I63",
//               "icdCodeDescription": "Cerebral infarction"
//             },
//             {
//               "icdCode": "E11.71",
//               "icdCodeDescription": "Type 2 diabetes mellitus with multiple microvascular complications"
//             },
//             {
//               "icdCode": "E11.70",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with multiple complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "I64",
//               "icdCodeDescription": "Stroke, not specified as haemorrhage or infarction"
//             },
//             {
//               "icdCode": "E14.2",
//               "icdCodeDescription": "Unspecified diabetes mellitus with renal complication"
//             },
//             {
//               "icdCode": "E14.1",
//               "icdCodeDescription": "Unspecified diabetes mellitus with acidosis"
//             },
//             {
//               "icdCode": "E14.0",
//               "icdCodeDescription": "Unspecified diabetes mellitus with hyperosmolarity"
//             },
//             {
//               "icdCode": "E14.6",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "E75.6",
//               "icdCodeDescription": "Lipid storage disorder, unspecified"
//             },
//             {
//               "icdCode": "I49.2",
//               "icdCodeDescription": "Junctional premature depolarisation"
//             },
//             {
//               "icdCode": "E13.10",
//               "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E14.5",
//               "icdCodeDescription": "Unspecified diabetes mellitus with circulatory complication"
//             },
//             {
//               "icdCode": "E13.11",
//               "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, without coma"
//             },
//             {
//               "icdCode": "E14.4",
//               "icdCodeDescription": "Unspecified diabetes mellitus with neurological complication"
//             },
//             {
//               "icdCode": "E75.4",
//               "icdCodeDescription": "Neuronal ceroid lipofuscinosis"
//             },
//             {
//               "icdCode": "E13.12",
//               "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, with coma"
//             },
//             {
//               "icdCode": "E14.3",
//               "icdCodeDescription": "Unspecified diabetes mellitus with ophthalmic complication"
//             },
//             {
//               "icdCode": "E75.5",
//               "icdCodeDescription": "Other lipid storage disorders"
//             },
//             {
//               "icdCode": "I49.3",
//               "icdCodeDescription": "Ventricular premature depolarisation"
//             },
//             {
//               "icdCode": "E14.9",
//               "icdCodeDescription": "Unspecified diabetes mellitus without complication"
//             },
//             {
//               "icdCode": "E14.8",
//               "icdCodeDescription": "Unspecified diabetes mellitus with unspecified complication"
//             },
//             {
//               "icdCode": "E14.7",
//               "icdCodeDescription": "Unspecified diabetes mellitus with multiple complications"
//             },
//             {
//               "icdCode": "U82.1",
//               "icdCodeDescription": "Ischaemic heart disease"
//             },
//             {
//               "icdCode": "E10.31",
//               "icdCodeDescription": "Type 1 diabetes mellitus with background retinopathy"
//             },
//             {
//               "icdCode": "I70",
//               "icdCodeDescription": "Atherosclerosis"
//             },
//             {
//               "icdCode": "E10.30",
//               "icdCodeDescription": "Type 1 diabetes mellitus with ophthalmic complication, unspecified"
//             },
//             {
//               "icdCode": "I72",
//               "icdCodeDescription": "Other aneurysm"
//             },
//             {
//               "icdCode": "I71",
//               "icdCodeDescription": "Aortic aneurysm and dissection"
//             },
//             {
//               "icdCode": "I74",
//               "icdCodeDescription": "Arterial embolism and thrombosis"
//             },
//             {
//               "icdCode": "I73",
//               "icdCodeDescription": "Other peripheral vascular diseases"
//             },
//             {
//               "icdCode": "E10.39",
//               "icdCodeDescription": "Type 1 diabetes mellitus with other specified ophthalmic complication"
//             },
//             {
//               "icdCode": "E14.73",
//               "icdCodeDescription": "Unspecified diabetes mellitus with foot ulcer due to multiple causes"
//             },
//             {
//               "icdCode": "E14.72",
//               "icdCodeDescription": "Unspecified diabetes mellitus with features of insulin resistance"
//             },
//             {
//               "icdCode": "E10.36",
//               "icdCodeDescription": "Type 1 diabetes mellitus with diabetic cataract"
//             },
//             {
//               "icdCode": "E10.35",
//               "icdCodeDescription": "Type 1 diabetes mellitus with advanced ophthalmic disease"
//             },
//             {
//               "icdCode": "E10.34",
//               "icdCodeDescription": "Type 1 diabetes mellitus with other retinopathy"
//             },
//             {
//               "icdCode": "E11.02",
//               "icdCodeDescription": "Type 2 diabetes mellitus with hyperosmolarity with coma"
//             },
//             {
//               "icdCode": "E10.33",
//               "icdCodeDescription": "Type 1 diabetes mellitus with proliferative retinopathy"
//             },
//             {
//               "icdCode": "E11.01",
//               "icdCodeDescription": "Type 2 diabetes mellitus with hyperosmolarity without nonketotic hyperglycaemic-hyperosmolar coma [NKHHC]"
//             },
//             {
//               "icdCode": "E10.32",
//               "icdCodeDescription": "Type 1 diabetes mellitus with preproliferative retinopathy"
//             },
//             {
//               "icdCode": "E11.00",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with coma, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E14.80",
//               "icdCodeDescription": "Unspecified diabetes mellitus with unspecified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "Z95",
//               "icdCodeDescription": "Presence of cardiac and vascular implants and grafts"
//             },
//             {
//               "icdCode": "I52.1",
//               "icdCodeDescription": "Other heart disorders in other infectious and parasitic diseases classified elsewhere"
//             },
//             {
//               "icdCode": "E14.81",
//               "icdCodeDescription": "Unspecified diabetes mellitus with unspecified complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "I52.0",
//               "icdCodeDescription": "Other heart disorders in bacterial diseases classified elsewhere"
//             },
//             {
//               "icdCode": "E10.42",
//               "icdCodeDescription": "Type 1 diabetes mellitus with diabetic polyneuropathy"
//             },
//             {
//               "icdCode": "E11.10",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with ketoacidosis, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E10.41",
//               "icdCodeDescription": "Type 1 diabetes mellitus with diabetic mononeuropathy"
//             },
//             {
//               "icdCode": "E10.40",
//               "icdCodeDescription": "Type 1 diabetes mellitus with unspecified neuropathy"
//             },
//             {
//               "icdCode": "E10.49",
//               "icdCodeDescription": "Type 1 diabetes mellitus with other specified neurological complication"
//             },
//             {
//               "icdCode": "I25.8",
//               "icdCodeDescription": "Other forms of chronic ischaemic heart disease"
//             },
//             {
//               "icdCode": "E11.16",
//               "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, with lactic acidosis, with coma"
//             },
//             {
//               "icdCode": "I25.9",
//               "icdCodeDescription": "Chronic ischaemic heart disease, unspecified"
//             },
//             {
//               "icdCode": "E11.15",
//               "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, with lactic acidosis, without coma"
//             },
//             {
//               "icdCode": "E11.14",
//               "icdCodeDescription": "Type 2 diabetes mellitus with lactic acidosis, with coma"
//             },
//             {
//               "icdCode": "I25.3",
//               "icdCodeDescription": "Aneurysm of heart"
//             },
//             {
//               "icdCode": "E11.13",
//               "icdCodeDescription": "Type 2 diabetes mellitus with lactic acidosis, without coma"
//             },
//             {
//               "icdCode": "I25.4",
//               "icdCodeDescription": "Coronary artery aneurysm"
//             },
//             {
//               "icdCode": "E11.12",
//               "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, with coma"
//             },
//             {
//               "icdCode": "I25.5",
//               "icdCodeDescription": "Ischaemic cardiomyopathy"
//             },
//             {
//               "icdCode": "I63.9",
//               "icdCodeDescription": "Cerebral infarction, unspecified"
//             },
//             {
//               "icdCode": "E10.43",
//               "icdCodeDescription": "Type 1 diabetes mellitus with diabetic autonomic neuropathy"
//             },
//             {
//               "icdCode": "E11.11",
//               "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, without coma"
//             },
//             {
//               "icdCode": "I25.6",
//               "icdCodeDescription": "Silent myocardial ischaemia"
//             },
//             {
//               "icdCode": "I25.0",
//               "icdCodeDescription": "Atherosclerotic cardiovascular disease, so described"
//             },
//             {
//               "icdCode": "I63.8",
//               "icdCodeDescription": "Other cerebral infarction"
//             },
//             {
//               "icdCode": "I25.1",
//               "icdCodeDescription": "Atherosclerotic heart disease"
//             },
//             {
//               "icdCode": "I63.5",
//               "icdCodeDescription": "Cerebral infarction due to unspecified occlusion or stenosis of cerebral arteries"
//             },
//             {
//               "icdCode": "I25.2",
//               "icdCodeDescription": "Old myocardial infarction"
//             },
//             {
//               "icdCode": "I63.6",
//               "icdCodeDescription": "Cerebral infarction due to cerebral venous thrombosis, nonpyogenic"
//             },
//             {
//               "icdCode": "E14.91",
//               "icdCodeDescription": "Unspecified diabetes mellitus without complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "I63.3",
//               "icdCodeDescription": "Cerebral infarction due to thrombosis of cerebral arteries"
//             },
//             {
//               "icdCode": "E14.90",
//               "icdCodeDescription": "Unspecified diabetes mellitus without complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "I63.4",
//               "icdCodeDescription": "Cerebral infarction due to embolism of cerebral arteries"
//             },
//             {
//               "icdCode": "I63.1",
//               "icdCodeDescription": "Cerebral infarction due to embolism of precerebral arteries"
//             },
//             {
//               "icdCode": "I63.2",
//               "icdCodeDescription": "Cerebral infarction due to unspecified occlusion or stenosis of precerebral arteries"
//             },
//             {
//               "icdCode": "I63.0",
//               "icdCodeDescription": "Cerebral infarction due to thrombosis of precerebral arteries"
//             },
//             {
//               "icdCode": "E10.53",
//               "icdCodeDescription": "Type 1 diabetes mellitus with diabetic ischaemic cardiomyopathy"
//             },
//             {
//               "icdCode": "E11.21",
//               "icdCodeDescription": "Type 2 diabetes mellitus with incipient diabetic nephropathy"
//             },
//             {
//               "icdCode": "E10.52",
//               "icdCodeDescription": "Type 1 diabetes mellitus with peripheral angiopathy, with gangrene"
//             },
//             {
//               "icdCode": "E11.20",
//               "icdCodeDescription": "Type 2 diabetes mellitus with renal complication, unspecified"
//             },
//             {
//               "icdCode": "E10.51",
//               "icdCodeDescription": "Type 1 diabetes mellitus with peripheral angiopathy, without gangrene"
//             },
//             {
//               "icdCode": "E10",
//               "icdCodeDescription": "Type 1 diabetes mellitus"
//             },
//             {
//               "icdCode": "E10.50",
//               "icdCodeDescription": "Type 1 diabetes mellitus with circulatory complication, unspecified"
//             },
//             {
//               "icdCode": "E11",
//               "icdCodeDescription": "Type 2 diabetes mellitus"
//             },
//             {
//               "icdCode": "I70.21",
//               "icdCodeDescription": "Atherosclerosis of arteries of extremities with intermittent claudication"
//             },
//             {
//               "icdCode": "E14",
//               "icdCodeDescription": "Unspecified diabetes mellitus"
//             },
//             {
//               "icdCode": "I70.20",
//               "icdCodeDescription": "Atherosclerosis of arteries of extremities, unspecified"
//             },
//             {
//               "icdCode": "E13",
//               "icdCodeDescription": "Other specified diabetes mellitus"
//             },
//             {
//               "icdCode": "E11.29",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other specified renal complication"
//             },
//             {
//               "icdCode": "E10.59",
//               "icdCodeDescription": "Type 1 diabetes mellitus with other specified circulatory complication"
//             },
//             {
//               "icdCode": "E11.23",
//               "icdCodeDescription": "Type 2 diabetes mellitus with advanced renal disease"
//             },
//             {
//               "icdCode": "E11.22",
//               "icdCodeDescription": "Type 2 diabetes mellitus with established diabetic nephropathy"
//             },
//             {
//               "icdCode": "I51.7",
//               "icdCodeDescription": "Cardiomegaly"
//             },
//             {
//               "icdCode": "I51.6",
//               "icdCodeDescription": "Cardiovascular disease, unspecified"
//             },
//             {
//               "icdCode": "I51.9",
//               "icdCodeDescription": "Heart disease, unspecified"
//             },
//             {
//               "icdCode": "I51.8",
//               "icdCodeDescription": "Other ill-defined heart diseases"
//             },
//             {
//               "icdCode": "I74.3",
//               "icdCodeDescription": "Embolism and thrombosis of arteries of lower extremities"
//             },
//             {
//               "icdCode": "I74.1",
//               "icdCodeDescription": "Embolism and thrombosis of other and unspecified parts of aorta"
//             },
//             {
//               "icdCode": "I51.5",
//               "icdCodeDescription": "Myocardial degeneration"
//             },
//             {
//               "icdCode": "I74.2",
//               "icdCodeDescription": "Embolism and thrombosis of arteries of upper extremities"
//             },
//             {
//               "icdCode": "I74.0",
//               "icdCodeDescription": "Embolism and thrombosis of abdominal aorta"
//             },
//             {
//               "icdCode": "E10.64",
//               "icdCodeDescription": "Type 1 diabetes mellitus with hypoglycaemia"
//             },
//             {
//               "icdCode": "E11.32",
//               "icdCodeDescription": "Type 2 diabetes mellitus with preproliferative retinopathy"
//             },
//             {
//               "icdCode": "E10.63",
//               "icdCodeDescription": "Type 1 diabetes mellitus with specified periodontal complication"
//             },
//             {
//               "icdCode": "E11.31",
//               "icdCodeDescription": "Type 2 diabetes mellitus with background retinopathy"
//             },
//             {
//               "icdCode": "E10.62",
//               "icdCodeDescription": "Type 1 diabetes mellitus with specified skin and subcutaneous tissue complication"
//             },
//             {
//               "icdCode": "E11.30",
//               "icdCodeDescription": "Type 2 diabetes mellitus with ophthalmic complication, unspecified"
//             },
//             {
//               "icdCode": "E10.61",
//               "icdCodeDescription": "Type 1 diabetes mellitus with specified diabetic musculoskeletal and connective tissue complication"
//             },
//             {
//               "icdCode": "E10.60",
//               "icdCodeDescription": "Insulin-dependent diabetes mellitus with other specified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "I24.8",
//               "icdCodeDescription": "Other forms of acute ischaemic heart disease"
//             },
//             {
//               "icdCode": "E11.39",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other specified ophthalmic complication"
//             },
//             {
//               "icdCode": "I24.9",
//               "icdCodeDescription": "Acute ischaemic heart disease, unspecified"
//             },
//             {
//               "icdCode": "E10.69",
//               "icdCodeDescription": "Type 1 diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "E11.36",
//               "icdCodeDescription": "Type 2 diabetes mellitus with diabetic cataract"
//             },
//             {
//               "icdCode": "E11.35",
//               "icdCodeDescription": "Type 2 diabetes mellitus with advanced ophthalmic disease"
//             },
//             {
//               "icdCode": "E11.34",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other retinopathy"
//             },
//             {
//               "icdCode": "E10.65",
//               "icdCodeDescription": "Type 1 diabetes mellitus with poor control"
//             },
//             {
//               "icdCode": "E11.33",
//               "icdCodeDescription": "Type 2 diabetes mellitus with proliferative retinopathy"
//             },
//             {
//               "icdCode": "I24.0",
//               "icdCodeDescription": "Coronary thrombosis not resulting in myocardial infarction"
//             },
//             {
//               "icdCode": "I24.1",
//               "icdCodeDescription": "Dresslers syndrome"
//             },
//             {
//               "icdCode": "E13.69",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "E14.36",
//               "icdCodeDescription": "Unspecified diabetes mellitus with diabetic cataract"
//             },
//             {
//               "icdCode": "E14.39",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified ophthalmic complication"
//             },
//             {
//               "icdCode": "E13.60",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.61",
//               "icdCodeDescription": "Other specified diabetes mellitus with specified diabetic musculoskeletal and connective tissue complication"
//             },
//             {
//               "icdCode": "E13.62",
//               "icdCodeDescription": "Other specified diabetes mellitus with specified skin and subcutaneous tissue complication"
//             },
//             {
//               "icdCode": "E14.31",
//               "icdCodeDescription": "Unspecified diabetes mellitus with background retinopathy"
//             },
//             {
//               "icdCode": "E13.63",
//               "icdCodeDescription": "Other specified diabetes mellitus with specified periodontal complication"
//             },
//             {
//               "icdCode": "E14.30",
//               "icdCodeDescription": "Unspecified diabetes mellitus with ophthalmic complication, unspecified"
//             },
//             {
//               "icdCode": "E13.64",
//               "icdCodeDescription": "Other specified diabetes mellitus with hypoglycaemia"
//             },
//             {
//               "icdCode": "E14.33",
//               "icdCodeDescription": "Unspecified diabetes mellitus with proliferative retinopathy"
//             },
//             {
//               "icdCode": "E13.65",
//               "icdCodeDescription": "Other specified diabetes mellitus with poor control"
//             },
//             {
//               "icdCode": "E14.32",
//               "icdCodeDescription": "Unspecified diabetes mellitus with preproliferative retinopathy"
//             },
//             {
//               "icdCode": "E14.35",
//               "icdCodeDescription": "Unspecified diabetes mellitus with advanced ophthalmic disease"
//             },
//             {
//               "icdCode": "E14.34",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other retinopathy"
//             },
//             {
//               "icdCode": "I73.8",
//               "icdCodeDescription": "Other specified peripheral vascular diseases"
//             },
//             {
//               "icdCode": "I73.9",
//               "icdCodeDescription": "Peripheral vascular disease, unspecified"
//             },
//             {
//               "icdCode": "E13.70",
//               "icdCodeDescription": "Other specified diabetes mellitus with multiple complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "I73.0",
//               "icdCodeDescription": "Raynauds syndrome"
//             },
//             {
//               "icdCode": "I73.1",
//               "icdCodeDescription": "Thromboangiitis obliterans [Buerger]"
//             },
//             {
//               "icdCode": "E78.0",
//               "icdCodeDescription": "Pure hypercholesterolaemia"
//             },
//             {
//               "icdCode": "E14.49",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified neurological complication"
//             },
//             {
//               "icdCode": "E13.71",
//               "icdCodeDescription": "Other specified diabetes mellitus with multiple microvascular complications"
//             },
//             {
//               "icdCode": "E14.40",
//               "icdCodeDescription": "Unspecified diabetes mellitus with unspecified neuropathy"
//             },
//             {
//               "icdCode": "E13.72",
//               "icdCodeDescription": "Other specified diabetes mellitus with features of insulin resistance"
//             },
//             {
//               "icdCode": "E78.8",
//               "icdCodeDescription": "Other disorders of lipoprotein metabolism"
//             },
//             {
//               "icdCode": "E78.5",
//               "icdCodeDescription": "Hyperlipidaemia, unspecified"
//             },
//             {
//               "icdCode": "E13.73",
//               "icdCodeDescription": "Other specified diabetes mellitus with foot ulcer due to multiple causes"
//             },
//             {
//               "icdCode": "E14.42",
//               "icdCodeDescription": "Unspecified diabetes mellitus with diabetic polyneuropathy"
//             },
//             {
//               "icdCode": "E14.41",
//               "icdCodeDescription": "Unspecified diabetes mellitus with diabetic mononeuropathy"
//             },
//             {
//               "icdCode": "E78.6",
//               "icdCodeDescription": "Lipoprotein deficiency"
//             },
//             {
//               "icdCode": "I69.8",
//               "icdCodeDescription": "Sequelae of other and unspecified cerebrovascular diseases"
//             },
//             {
//               "icdCode": "E78.3",
//               "icdCodeDescription": "Hyperchylomicronaemia"
//             },
//             {
//               "icdCode": "E10.02",
//               "icdCodeDescription": "Type 1 diabetes mellitus with hyperosmolarity with coma"
//             },
//             {
//               "icdCode": "I23.5",
//               "icdCodeDescription": "Rupture of papillary muscle as current complication following acute myocardial infarction"
//             },
//             {
//               "icdCode": "E78.4",
//               "icdCodeDescription": "Other hyperlipidaemia"
//             },
//             {
//               "icdCode": "E14.43",
//               "icdCodeDescription": "Unspecified diabetes mellitus with diabetic autonomic neuropathy"
//             },
//             {
//               "icdCode": "E10.01",
//               "icdCodeDescription": "Insulin-dependent diabetes mellitus with coma, stated as uncontrolled"
//             },
//             {
//               "icdCode": "I23.6",
//               "icdCodeDescription": "Thrombosis of atrium, auricular appendage, and ventricle as current complications following acute myocardial infarction"
//             },
//             {
//               "icdCode": "E78.1",
//               "icdCodeDescription": "Pure hyperglyceridaemia"
//             },
//             {
//               "icdCode": "E10.00",
//               "icdCodeDescription": "Insulin-dependent diabetes mellitus with coma, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "I69.3",
//               "icdCodeDescription": "Sequelae of cerebral infarction"
//             },
//             {
//               "icdCode": "I23.8",
//               "icdCodeDescription": "Other current complications following acute myocardial infarction"
//             },
//             {
//               "icdCode": "I69.4",
//               "icdCodeDescription": "Sequelae of stroke, not specified as haemorrhage or infarction"
//             },
//             {
//               "icdCode": "I23.1",
//               "icdCodeDescription": "Atrial septal defect as current complication following acute myocardial infarction"
//             },
//             {
//               "icdCode": "I23.2",
//               "icdCodeDescription": "Ventricular septal defect as current complication following acute myocardial infarction"
//             },
//             {
//               "icdCode": "I23.3",
//               "icdCodeDescription": "Rupture of cardiac wall without haemopericardium as current complication following acute myocardial infarction"
//             },
//             {
//               "icdCode": "I23.4",
//               "icdCodeDescription": "Rupture of chordae tendineae as current complication following acute myocardial infarction"
//             },
//             {
//               "icdCode": "E13.80",
//               "icdCodeDescription": "Other specified diabetes mellitus with unspecified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E78.9",
//               "icdCodeDescription": "Disorder of lipoprotein metabolism, unspecified"
//             },
//             {
//               "icdCode": "E13.81",
//               "icdCodeDescription": "Other specified diabetes mellitus with unspecified complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "I23.0",
//               "icdCodeDescription": "Haemopericardium as current complication following acute myocardial infarction"
//             },
//             {
//               "icdCode": "E14.59",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified circulatory complication"
//             },
//             {
//               "icdCode": "E14.51",
//               "icdCodeDescription": "Unspecified diabetes mellitus with peripheral angiopathy without gangrene"
//             },
//             {
//               "icdCode": "E14.50",
//               "icdCodeDescription": "Unspecified diabetes mellitus with circulatory complication, unspecified"
//             },
//             {
//               "icdCode": "E10.16",
//               "icdCodeDescription": "Type 1 diabetes mellitus with ketoacidosis, with lactic acidosis, with coma"
//             },
//             {
//               "icdCode": "E14.53",
//               "icdCodeDescription": "Unspecified diabetes mellitus with diabetic ischaemic cardiomyopathy"
//             },
//             {
//               "icdCode": "E10.15",
//               "icdCodeDescription": "Type 1 diabetes mellitus with ketoacidosis, with lactic acidosis, without coma"
//             },
//             {
//               "icdCode": "E14.52",
//               "icdCodeDescription": "Unspecified diabetes mellitus with peripheral angiopathy with gangrene"
//             },
//             {
//               "icdCode": "E10.14",
//               "icdCodeDescription": "Type 1 diabetes mellitus with lactic acidosis, with coma"
//             },
//             {
//               "icdCode": "E10.13",
//               "icdCodeDescription": "Type 1 diabetes mellitus with lactic acidosis, without coma"
//             },
//             {
//               "icdCode": "E10.12",
//               "icdCodeDescription": "Type 1 diabetes mellitus with ketoacidosis, with coma"
//             },
//             {
//               "icdCode": "E10.11",
//               "icdCodeDescription": "Type 1 diabetes mellitus with ketoacidosis, without coma"
//             },
//             {
//               "icdCode": "E10.10",
//               "icdCodeDescription": "Insulin-dependent diabetes mellitus with ketoacidosis, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "I72.5",
//               "icdCodeDescription": "Aneurysm and dissection of other precerebral arteries"
//             },
//             {
//               "icdCode": "E13.90",
//               "icdCodeDescription": "Other specified diabetes mellitus without complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.91",
//               "icdCodeDescription": "Other specified diabetes mellitus without complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E14.60",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "I72.3",
//               "icdCodeDescription": "Aneurysm of iliac artery"
//             },
//             {
//               "icdCode": "I72.4",
//               "icdCodeDescription": "Aneurysm of artery of lower extremity"
//             },
//             {
//               "icdCode": "I72.1",
//               "icdCodeDescription": "Aneurysm of artery of upper extremity"
//             },
//             {
//               "icdCode": "I72.2",
//               "icdCodeDescription": "Aneurysm of renal artery"
//             },
//             {
//               "icdCode": "I72.0",
//               "icdCodeDescription": "Aneurysm of carotid artery"
//             },
//             {
//               "icdCode": "E10.20",
//               "icdCodeDescription": "Type 1 diabetes mellitus with renal complication, unspecified"
//             },
//             {
//               "icdCode": "E14.69",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "E10.2",
//               "icdCodeDescription": "Type 1 diabetes mellitus with renal complication"
//             },
//             {
//               "icdCode": "R07.4",
//               "icdCodeDescription": "Chest pain, unspecified"
//             },
//             {
//               "icdCode": "E10.1",
//               "icdCodeDescription": "Type 1 diabetes mellitus with acidosis"
//             },
//             {
//               "icdCode": "E10.0",
//               "icdCodeDescription": "Insulin-dependent diabetes mellitus with coma"
//             },
//             {
//               "icdCode": "E10.6",
//               "icdCodeDescription": "Type 1 diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "E14.62",
//               "icdCodeDescription": "Unspecified diabetes mellitus with specified skin and subcutaneous tissue complication"
//             },
//             {
//               "icdCode": "E10.5",
//               "icdCodeDescription": "Type 1 diabetes mellitus with circulatory complication"
//             },
//             {
//               "icdCode": "E14.61",
//               "icdCodeDescription": "Unspecified diabetes mellitus with specified diabetic musculoskeletal and connective tissue complication"
//             },
//             {
//               "icdCode": "E10.4",
//               "icdCodeDescription": "Type 1 diabetes mellitus with neurological complication"
//             },
//             {
//               "icdCode": "E14.64",
//               "icdCodeDescription": "Unspecified diabetes mellitus with hypoglycaemia"
//             },
//             {
//               "icdCode": "E10.3",
//               "icdCodeDescription": "Type 1 diabetes mellitus with ophthalmic complication"
//             },
//             {
//               "icdCode": "E14.63",
//               "icdCodeDescription": "Unspecified diabetes mellitus with specified periodontal complication"
//             },
//             {
//               "icdCode": "E10.23",
//               "icdCodeDescription": "Type 1 diabetes mellitus with advanced renal disease"
//             },
//             {
//               "icdCode": "E10.9",
//               "icdCodeDescription": "Insulin-dependent diabetes mellitus without complications"
//             },
//             {
//               "icdCode": "E14.65",
//               "icdCodeDescription": "Unspecified diabetes mellitus with poor control"
//             },
//             {
//               "icdCode": "E10.8",
//               "icdCodeDescription": "Type 1 diabetes mellitus with unspecified complication"
//             },
//             {
//               "icdCode": "E10.22",
//               "icdCodeDescription": "Type 1 diabetes mellitus with established diabetic nephropathy"
//             },
//             {
//               "icdCode": "I22.8",
//               "icdCodeDescription": "Subsequent myocardial infarction of other sites"
//             },
//             {
//               "icdCode": "E10.7",
//               "icdCodeDescription": "Type 1 diabetes mellitus with multiple complications"
//             },
//             {
//               "icdCode": "E10.21",
//               "icdCodeDescription": "Type 1 diabetes mellitus with incipient diabetic nephropathy"
//             },
//             {
//               "icdCode": "I22.9",
//               "icdCodeDescription": "Subsequent myocardial infarction of unspecified site"
//             },
//             {
//               "icdCode": "K76.0",
//               "icdCodeDescription": "Fatty (change of) liver, not elsewhere classified"
//             },
//             {
//               "icdCode": "E14.71",
//               "icdCodeDescription": "Unspecified diabetes mellitus with multiple microvascular complications"
//             },
//             {
//               "icdCode": "I22.0",
//               "icdCodeDescription": "Subsequent myocardial infarction of anterior wall"
//             },
//             {
//               "icdCode": "E10.29",
//               "icdCodeDescription": "Type 1 diabetes mellitus with other specified renal complication"
//             },
//             {
//               "icdCode": "E14.70",
//               "icdCodeDescription": "Unspecified diabetes mellitus with multiple complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "I22.1",
//               "icdCodeDescription": "Subsequent myocardial infarction of inferior wall"
//             }
//           ]
//         }
//       },
//       {
//         "serviceCode": "0606245396",
//         "serviceDescription": "Nervamine 500 Mcg 30tabs",
//         "requestedQuantity": "3",
//         "amount": "20.8",
//         "daysOfSupply": "90",
//         "status": "REJECTED",
//         "errors": [
//           {
//             "description": "Medication 0606245396 is not indicated with diagnosis code K76.9",
//             "code": "FDB_CPINDI001"
//           },
//           {
//             "description": "Medication 0606245396 is not indicated with diagnosis code I10",
//             "code": "FDB_CPINDI001"
//           },
//           {
//             "description": "Medication 0606245396 is not indicated with diagnosis code R53",
//             "code": "FDB_CPINDI001"
//           },
//           {
//             "description": "Medication 0606245396 is not indicated with diagnosis code E78.2",
//             "code": "FDB_CPINDI001"
//           },
//           {
//             "description": "Medication 0606245396 is not indicated with diagnosis code E11.69",
//             "code": "FDB_CPINDI001"
//           }
//         ],
//         "request_detail_no": 27015465,
//         "suggestion": {
//           "serviceCode": "0606245396",
//           "scientificCode": "7000000829-500-100000073665",
//           "suggestedIcds": []
//         }
//       },
//       {
//         "serviceCode": "1611211330",
//         "serviceDescription": "Resilia 40 Mg 30 Tablets",
//         "requestedQuantity": "3",
//         "amount": "0.0",
//         "daysOfSupply": "90",
//         "status": "REJECTED",
//         "errors": [
//           {
//             "description": "Medication 1611211330 is not indicated with diagnosis code K76.9",
//             "code": "FDB_CPINDI001"
//           },
//           {
//             "description": "Medication 1611211330 is not indicated with diagnosis code I10",
//             "code": "FDB_CPINDI001"
//           },
//           {
//             "description": "Medication 1611211330 is not indicated with diagnosis code R53",
//             "code": "FDB_CPINDI001"
//           },
//           {
//             "description": "Medication 1611211330 is not indicated with diagnosis code E78.2",
//             "code": "FDB_CPINDI001"
//           },
//           {
//             "description": "Medication 1611211330 is not indicated with diagnosis code E11.69",
//             "code": "FDB_CPINDI001"
//           }
//         ],
//         "request_detail_no": 27039046,
//         "suggestion": {
//           "serviceCode": "1611211330",
//           "scientificCode": "7000000506-40-100000073665",
//           "suggestedIcds": [
//             {
//               "icdCode": "M10.9",
//               "icdCodeDescription": "Gout, unspecified"
//             },
//             {
//               "icdCode": "M10.09",
//               "icdCodeDescription": "Idiopathic gout, site unspecified"
//             },
//             {
//               "icdCode": "M14.0",
//               "icdCodeDescription": "Gouty arthropathy due to enzyme defects and other inherited disorders"
//             },
//             {
//               "icdCode": "M10",
//               "icdCodeDescription": "Gout"
//             },
//             {
//               "icdCode": "M10.34",
//               "icdCodeDescription": "Gout due to impairment of renal function, hand"
//             },
//             {
//               "icdCode": "M10.98",
//               "icdCodeDescription": "Gout, unspecified, other site"
//             },
//             {
//               "icdCode": "E79.0",
//               "icdCodeDescription": "Hyperuricaemia without signs of inflammatory arthritis and tophaceous disease"
//             },
//             {
//               "icdCode": "M10.99",
//               "icdCodeDescription": "Gout, unspecified, site unspecified"
//             },
//             {
//               "icdCode": "M10.00",
//               "icdCodeDescription": "Idiopathic gout, multiple sites"
//             },
//             {
//               "icdCode": "N23",
//               "icdCodeDescription": "Unspecified renal colic"
//             },
//             {
//               "icdCode": "M10.96",
//               "icdCodeDescription": "Gout, unspecified, lower leg"
//             },
//             {
//               "icdCode": "M10.30",
//               "icdCodeDescription": "Gout due to impairment of renal function, multiple sites"
//             },
//             {
//               "icdCode": "M10.97",
//               "icdCodeDescription": "Gout, unspecified, ankle and foot"
//             },
//             {
//               "icdCode": "N13.2",
//               "icdCodeDescription": "Hydronephrosis with renal and ureteral calculous obstruction"
//             },
//             {
//               "icdCode": "M10.94",
//               "icdCodeDescription": "Gout, unspecified, hand"
//             },
//             {
//               "icdCode": "M10.95",
//               "icdCodeDescription": "Gout, unspecified, pelvic region and thigh"
//             },
//             {
//               "icdCode": "M10.40",
//               "icdCodeDescription": "Other secondary gout, multiple sites"
//             },
//             {
//               "icdCode": "M10.92",
//               "icdCodeDescription": "Gout, unspecified, upper arm"
//             },
//             {
//               "icdCode": "M10.93",
//               "icdCodeDescription": "Gout, unspecified, forearm"
//             },
//             {
//               "icdCode": "M10.90",
//               "icdCodeDescription": "Gout, unspecified, multiple sites"
//             },
//             {
//               "icdCode": "M10.91",
//               "icdCodeDescription": "Gout, unspecified, shoulder region"
//             }
//           ]
//         }
//       },
//       {
//         "serviceCode": "53-22-02",
//         "serviceDescription": "Concor-Cor 2.5 mg Tablet 30pcs",
//         "requestedQuantity": "1",
//         "amount": "19.55",
//         "daysOfSupply": "90",
//         "status": "APPROVED",
//         "request_detail_no": 27015434,
//         "suggestion": {
//           "serviceCode": "53-22-02",
//           "scientificCode": "7000000155-2.5-100000073665",
//           "suggestedIcds": [
//             {
//               "icdCode": "Z95",
//               "icdCodeDescription": "Presence of cardiac and vascular implants and grafts"
//             },
//             {
//               "icdCode": "G43",
//               "icdCodeDescription": "Migraine"
//             },
//             {
//               "icdCode": "Q23.83",
//               "icdCodeDescription": "Congenital bicuspid aortic valve"
//             },
//             {
//               "icdCode": "G44",
//               "icdCodeDescription": "Other headache syndromes"
//             },
//             {
//               "icdCode": "I25.8",
//               "icdCodeDescription": "Other forms of chronic ischaemic heart disease"
//             },
//             {
//               "icdCode": "I48.9",
//               "icdCodeDescription": "Atrial fibrillation and atrial flutter, unspecified"
//             },
//             {
//               "icdCode": "I25.9",
//               "icdCodeDescription": "Chronic ischaemic heart disease, unspecified"
//             },
//             {
//               "icdCode": "I05",
//               "icdCodeDescription": "Rheumatic mitral valve diseases"
//             },
//             {
//               "icdCode": "I48.3",
//               "icdCodeDescription": "Typical atrial flutter"
//             },
//             {
//               "icdCode": "I44.7",
//               "icdCodeDescription": "Left bundle-branch block, unspecified"
//             },
//             {
//               "icdCode": "I48.2",
//               "icdCodeDescription": "Chronic atrial fibrillation"
//             },
//             {
//               "icdCode": "I21.9",
//               "icdCodeDescription": "Acute myocardial infarction, unspecified"
//             },
//             {
//               "icdCode": "I25.5",
//               "icdCodeDescription": "Ischaemic cardiomyopathy"
//             },
//             {
//               "icdCode": "I48.4",
//               "icdCodeDescription": "Atypical atrial flutter"
//             },
//             {
//               "icdCode": "I21.3",
//               "icdCodeDescription": "Acute transmural myocardial infarction of unspecified site"
//             },
//             {
//               "icdCode": "I21.4",
//               "icdCodeDescription": "Acute subendocardial myocardial infarction"
//             },
//             {
//               "icdCode": "I25.0",
//               "icdCodeDescription": "Atherosclerotic cardiovascular disease, so described"
//             },
//             {
//               "icdCode": "I25.1",
//               "icdCodeDescription": "Atherosclerotic heart disease"
//             },
//             {
//               "icdCode": "I48.1",
//               "icdCodeDescription": "Persistent atrial fibrillation"
//             },
//             {
//               "icdCode": "I25.2",
//               "icdCodeDescription": "Old myocardial infarction"
//             },
//             {
//               "icdCode": "I48.0",
//               "icdCodeDescription": "Paroxysmal atrial fibrillation"
//             },
//             {
//               "icdCode": "I21.0",
//               "icdCodeDescription": "Acute transmural myocardial infarction of anterior wall"
//             },
//             {
//               "icdCode": "I21.1",
//               "icdCodeDescription": "Acute transmural myocardial infarction of inferior wall"
//             },
//             {
//               "icdCode": "I21.2",
//               "icdCodeDescription": "Acute transmural myocardial infarction of other sites"
//             },
//             {
//               "icdCode": "I70.24",
//               "icdCodeDescription": "Atherosclerosis of arteries of extremities with gangrene"
//             },
//             {
//               "icdCode": "I10",
//               "icdCodeDescription": "Essential (primary) hypertension"
//             },
//             {
//               "icdCode": "I12",
//               "icdCodeDescription": "Hypertensive renal disease"
//             },
//             {
//               "icdCode": "I11",
//               "icdCodeDescription": "Hypertensive heart disease"
//             },
//             {
//               "icdCode": "I25.11",
//               "icdCodeDescription": "Atherosclerotic heart disease, of native coronary artery"
//             },
//             {
//               "icdCode": "I13",
//               "icdCodeDescription": "Hypertensive heart and renal disease"
//             },
//             {
//               "icdCode": "I13.9",
//               "icdCodeDescription": "Hypertensive heart and renal disease, unspecified"
//             },
//             {
//               "icdCode": "I51.7",
//               "icdCodeDescription": "Cardiomegaly"
//             },
//             {
//               "icdCode": "I51.6",
//               "icdCodeDescription": "Cardiovascular disease, unspecified"
//             },
//             {
//               "icdCode": "Z95.5",
//               "icdCodeDescription": "Presence of coronary angioplasty implant and graft"
//             },
//             {
//               "icdCode": "I51.9",
//               "icdCodeDescription": "Heart disease, unspecified"
//             },
//             {
//               "icdCode": "Z95.3",
//               "icdCodeDescription": "Presence of xenogenic heart valve"
//             },
//             {
//               "icdCode": "I13.2",
//               "icdCodeDescription": "Hypertensive heart and renal disease with both (congestive) heart failure and renal failure"
//             },
//             {
//               "icdCode": "I70.8",
//               "icdCodeDescription": "Atherosclerosis of other arteries"
//             },
//             {
//               "icdCode": "Z95.4",
//               "icdCodeDescription": "Presence of other heart-valve replacement"
//             },
//             {
//               "icdCode": "I13.1",
//               "icdCodeDescription": "Hypertensive heart and renal disease with renal failure"
//             },
//             {
//               "icdCode": "Z95.1",
//               "icdCodeDescription": "Presence of aortocoronary bypass graft"
//             },
//             {
//               "icdCode": "I13.0",
//               "icdCodeDescription": "Hypertensive heart and renal disease with (congestive) heart failure"
//             },
//             {
//               "icdCode": "I51.4",
//               "icdCodeDescription": "Myocarditis, unspecified"
//             },
//             {
//               "icdCode": "Z95.2",
//               "icdCodeDescription": "Presence of prosthetic heart valve"
//             },
//             {
//               "icdCode": "I70.0",
//               "icdCodeDescription": "Atherosclerosis of aorta"
//             },
//             {
//               "icdCode": "I05.9",
//               "icdCodeDescription": "Mitral valve disease, unspecified"
//             },
//             {
//               "icdCode": "I21",
//               "icdCodeDescription": "Acute myocardial infarction"
//             },
//             {
//               "icdCode": "I20",
//               "icdCodeDescription": "Angina pectoris"
//             },
//             {
//               "icdCode": "I24.8",
//               "icdCodeDescription": "Other forms of acute ischaemic heart disease"
//             },
//             {
//               "icdCode": "G43.1",
//               "icdCodeDescription": "Migraine with aura [classical migraine]"
//             },
//             {
//               "icdCode": "I22",
//               "icdCodeDescription": "Subsequent myocardial infarction"
//             },
//             {
//               "icdCode": "I24.9",
//               "icdCodeDescription": "Acute ischaemic heart disease, unspecified"
//             },
//             {
//               "icdCode": "I25",
//               "icdCodeDescription": "Chronic ischaemic heart disease"
//             },
//             {
//               "icdCode": "I05.2",
//               "icdCodeDescription": "Mitral stenosis with insufficiency"
//             },
//             {
//               "icdCode": "I47.9",
//               "icdCodeDescription": "Paroxysmal tachycardia, unspecified"
//             },
//             {
//               "icdCode": "I24",
//               "icdCodeDescription": "Other acute ischaemic heart diseases"
//             },
//             {
//               "icdCode": "I20.8",
//               "icdCodeDescription": "Other forms of angina pectoris"
//             },
//             {
//               "icdCode": "I05.8",
//               "icdCodeDescription": "Other mitral valve diseases"
//             },
//             {
//               "icdCode": "I20.9",
//               "icdCodeDescription": "Angina pectoris, unspecified"
//             },
//             {
//               "icdCode": "Z95.9",
//               "icdCodeDescription": "Presence of cardiac and vascular implant and graft, unspecified"
//             },
//             {
//               "icdCode": "G43.9",
//               "icdCodeDescription": "Migraine, unspecified"
//             },
//             {
//               "icdCode": "I47.2",
//               "icdCodeDescription": "Ventricular tachycardia"
//             },
//             {
//               "icdCode": "I47.1",
//               "icdCodeDescription": "Supraventricular tachycardia"
//             },
//             {
//               "icdCode": "I20.0",
//               "icdCodeDescription": "Unstable angina"
//             },
//             {
//               "icdCode": "I05.0",
//               "icdCodeDescription": "Mitral stenosis"
//             },
//             {
//               "icdCode": "I20.1",
//               "icdCodeDescription": "Angina pectoris with documented spasm"
//             },
//             {
//               "icdCode": "O90.3",
//               "icdCodeDescription": "Cardiomyopathy in the puerperium"
//             },
//             {
//               "icdCode": "I35.8",
//               "icdCodeDescription": "Other aortic valve disorders"
//             },
//             {
//               "icdCode": "I35.9",
//               "icdCodeDescription": "Aortic valve disorder, unspecified"
//             },
//             {
//               "icdCode": "R51",
//               "icdCodeDescription": "Headache"
//             },
//             {
//               "icdCode": "I39.0",
//               "icdCodeDescription": "Mitral valve disorders in diseases classified elsewhere"
//             },
//             {
//               "icdCode": "I39.1",
//               "icdCodeDescription": "Aortic valve disorders in diseases classified elsewhere"
//             },
//             {
//               "icdCode": "I97.82",
//               "icdCodeDescription": "Pacemaker syndrome"
//             },
//             {
//               "icdCode": "I12.9",
//               "icdCodeDescription": "Hypertensive renal disease without renal failure"
//             },
//             {
//               "icdCode": "I12.0",
//               "icdCodeDescription": "Hypertensive renal disease with renal failure"
//             },
//             {
//               "icdCode": "I35.0",
//               "icdCodeDescription": "Aortic (valve) stenosis"
//             },
//             {
//               "icdCode": "I35.1",
//               "icdCodeDescription": "Aortic (valve) insufficiency"
//             },
//             {
//               "icdCode": "I35.2",
//               "icdCodeDescription": "Aortic (valve) stenosis with insufficiency"
//             },
//             {
//               "icdCode": "I50.9",
//               "icdCodeDescription": "Heart failure, unspecified"
//             },
//             {
//               "icdCode": "I50.0",
//               "icdCodeDescription": "Congestive heart failure"
//             },
//             {
//               "icdCode": "I50.1",
//               "icdCodeDescription": "Left ventricular failure"
//             },
//             {
//               "icdCode": "I42",
//               "icdCodeDescription": "Cardiomyopathy"
//             },
//             {
//               "icdCode": "I08.0",
//               "icdCodeDescription": "Disorders of both mitral and aortic valves"
//             },
//             {
//               "icdCode": "I44",
//               "icdCodeDescription": "Atrioventricular and left bundle-branch block"
//             },
//             {
//               "icdCode": "R00.0",
//               "icdCodeDescription": "Tachycardia, unspecified"
//             },
//             {
//               "icdCode": "I47",
//               "icdCodeDescription": "Paroxysmal tachycardia"
//             },
//             {
//               "icdCode": "I49",
//               "icdCodeDescription": "Other cardiac arrhythmias"
//             },
//             {
//               "icdCode": "I42.9",
//               "icdCodeDescription": "Cardiomyopathy, unspecified"
//             },
//             {
//               "icdCode": "I48",
//               "icdCodeDescription": "Atrial fibrillation and flutter"
//             },
//             {
//               "icdCode": "I27.2",
//               "icdCodeDescription": "Other secondary pulmonary hypertension"
//             },
//             {
//               "icdCode": "I42.8",
//               "icdCodeDescription": "Other cardiomyopathies"
//             },
//             {
//               "icdCode": "R00.2",
//               "icdCodeDescription": "Palpitations"
//             },
//             {
//               "icdCode": "I08.2",
//               "icdCodeDescription": "Disorders of both aortic and tricuspid valves"
//             },
//             {
//               "icdCode": "I42.7",
//               "icdCodeDescription": "Cardiomyopathy due to drugs and other external agents"
//             },
//             {
//               "icdCode": "I42.1",
//               "icdCodeDescription": "Obstructive hypertrophic cardiomyopathy"
//             },
//             {
//               "icdCode": "I42.0",
//               "icdCodeDescription": "Dilated cardiomyopathy"
//             },
//             {
//               "icdCode": "I42.2",
//               "icdCodeDescription": "Other hypertrophic cardiomyopathy"
//             },
//             {
//               "icdCode": "I50",
//               "icdCodeDescription": "Heart failure"
//             },
//             {
//               "icdCode": "I11.9",
//               "icdCodeDescription": "Hypertensive heart disease without (congestive) heart failure"
//             },
//             {
//               "icdCode": "I15.2",
//               "icdCodeDescription": "Hypertension secondary to endocrine disorders"
//             },
//             {
//               "icdCode": "I15.9",
//               "icdCodeDescription": "Secondary hypertension, unspecified"
//             },
//             {
//               "icdCode": "I15.8",
//               "icdCodeDescription": "Other secondary hypertension"
//             },
//             {
//               "icdCode": "I34.1",
//               "icdCodeDescription": "Mitral (valve) prolapse"
//             },
//             {
//               "icdCode": "I11.0",
//               "icdCodeDescription": "Hypertensive heart disease with (congestive) heart failure"
//             },
//             {
//               "icdCode": "I15.1",
//               "icdCodeDescription": "Hypertension secondary to other renal disorders"
//             },
//             {
//               "icdCode": "I34.0",
//               "icdCodeDescription": "Mitral (valve) insufficiency"
//             },
//             {
//               "icdCode": "R07.1",
//               "icdCodeDescription": "Chest pain on breathing"
//             },
//             {
//               "icdCode": "R07.4",
//               "icdCodeDescription": "Chest pain, unspecified"
//             },
//             {
//               "icdCode": "I49.9",
//               "icdCodeDescription": "Cardiac arrhythmia, unspecified"
//             },
//             {
//               "icdCode": "R07.3",
//               "icdCodeDescription": "Other chest pain"
//             },
//             {
//               "icdCode": "I49.8",
//               "icdCodeDescription": "Other specified cardiac arrhythmias"
//             },
//             {
//               "icdCode": "K76.6",
//               "icdCodeDescription": "Portal hypertension"
//             },
//             {
//               "icdCode": "I49.1",
//               "icdCodeDescription": "Atrial premature depolarisation"
//             },
//             {
//               "icdCode": "I22.8",
//               "icdCodeDescription": "Subsequent myocardial infarction of other sites"
//             },
//             {
//               "icdCode": "I22.9",
//               "icdCodeDescription": "Subsequent myocardial infarction of unspecified site"
//             },
//             {
//               "icdCode": "I49.3",
//               "icdCodeDescription": "Ventricular premature depolarisation"
//             },
//             {
//               "icdCode": "I22.0",
//               "icdCodeDescription": "Subsequent myocardial infarction of anterior wall"
//             },
//             {
//               "icdCode": "U82.1",
//               "icdCodeDescription": "Ischaemic heart disease"
//             },
//             {
//               "icdCode": "U82.2",
//               "icdCodeDescription": "Chronic heart failure"
//             },
//             {
//               "icdCode": "U82.3",
//               "icdCodeDescription": "Hypertension"
//             }
//           ]
//         }
//       },
//       {
//         "serviceCode": "57-370-15",
//         "serviceDescription": "Jalra M Tablet 50/1000 mg 60 Tablets",
//         "requestedQuantity": "1",
//         "amount": "141.0",
//         "daysOfSupply": "90",
//         "status": "APPROVED",
//         "request_detail_no": 27015442,
//         "suggestion": {
//           "serviceCode": "57-370-15",
//           "scientificCode": "14000002146-1050-100000073665",
//           "suggestedIcds": [
//             {
//               "icdCode": "E13.29",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified renal complication"
//             },
//             {
//               "icdCode": "E11.81",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with unspecified complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.80",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with unspecified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E12.50",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with peripheral circulatory complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E12.51",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with peripheral circulatory complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.20",
//               "icdCodeDescription": "Other specified diabetes mellitus with renal complication, unspecified"
//             },
//             {
//               "icdCode": "E13.21",
//               "icdCodeDescription": "Other specified diabetes mellitus with incipient diabetic nephropathy"
//             },
//             {
//               "icdCode": "E13.22",
//               "icdCodeDescription": "Other specified diabetes mellitus with established diabetic nephropathy"
//             },
//             {
//               "icdCode": "E13.23",
//               "icdCodeDescription": "Other specified diabetes mellitus with advanced renal disease"
//             },
//             {
//               "icdCode": "E11.90",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus without complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.35",
//               "icdCodeDescription": "Other specified diabetes mellitus with advanced ophthalmic disease"
//             },
//             {
//               "icdCode": "E13.36",
//               "icdCodeDescription": "Other specified diabetes mellitus with diabetic cataract"
//             },
//             {
//               "icdCode": "E11.1",
//               "icdCodeDescription": "Type 2 diabetes mellitus with acidosis"
//             },
//             {
//               "icdCode": "E13.39",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified ophthalmic complication"
//             },
//             {
//               "icdCode": "E11.0",
//               "icdCodeDescription": "Type 2 diabetes mellitus with hyperosmolarity"
//             },
//             {
//               "icdCode": "G63.2",
//               "icdCodeDescription": "Diabetic polyneuropathy"
//             },
//             {
//               "icdCode": "E11.91",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus without complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.5",
//               "icdCodeDescription": "Type 2 diabetes mellitus with circulatory complciation"
//             },
//             {
//               "icdCode": "E11.4",
//               "icdCodeDescription": "Type 2 diabetes mellitus with neurological complication"
//             },
//             {
//               "icdCode": "E12.60",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with other specified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.3",
//               "icdCodeDescription": "Type 2 diabetes mellitus with ophthalmic complication"
//             },
//             {
//               "icdCode": "E12.61",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with other specified complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.2",
//               "icdCodeDescription": "Type 2 diabetes mellitus with renal complication"
//             },
//             {
//               "icdCode": "E13.30",
//               "icdCodeDescription": "Other specified diabetes mellitus with ophthalmic complication, unspecified"
//             },
//             {
//               "icdCode": "E11.9",
//               "icdCodeDescription": "Type 2 diabetes mellitus without complication"
//             },
//             {
//               "icdCode": "E13.31",
//               "icdCodeDescription": "Other specified diabetes mellitus with background retinopathy"
//             },
//             {
//               "icdCode": "E14.00",
//               "icdCodeDescription": "Unspecified diabetes mellitus with coma, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.8",
//               "icdCodeDescription": "Type 2 diabetes mellitus with unspecified complication"
//             },
//             {
//               "icdCode": "E13.32",
//               "icdCodeDescription": "Other specified diabetes mellitus with preproliferative retinopathy"
//             },
//             {
//               "icdCode": "E11.7",
//               "icdCodeDescription": "Type 2 diabetes mellitus with multiple complications"
//             },
//             {
//               "icdCode": "E13.33",
//               "icdCodeDescription": "Other specified diabetes mellitus with proliferative retinopathy"
//             },
//             {
//               "icdCode": "E14.02",
//               "icdCodeDescription": "Unspecified diabetes mellitus with hyperosmolarity, with coma"
//             },
//             {
//               "icdCode": "E11.6",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "E13.34",
//               "icdCodeDescription": "Other specified diabetes mellitus with other retinopathy"
//             },
//             {
//               "icdCode": "E14.01",
//               "icdCodeDescription": "Unspecified diabetes mellitus with hyperosmolarity, without nonketotic hyperglycaemic-hyperosmolar coma [NKHHC]"
//             },
//             {
//               "icdCode": "E14.15",
//               "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, with lactic acidosis, without coma"
//             },
//             {
//               "icdCode": "E14.14",
//               "icdCodeDescription": "Unspecified diabetes mellitus with lactic acidosis, with coma"
//             },
//             {
//               "icdCode": "E13.49",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified neurological complication"
//             },
//             {
//               "icdCode": "E14.16",
//               "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, with lactic acidosis, with coma"
//             },
//             {
//               "icdCode": "I10",
//               "icdCodeDescription": "Essential (primary) hypertension"
//             },
//             {
//               "icdCode": "E12.70",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with multiple complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E12.71",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with multiple complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.40",
//               "icdCodeDescription": "Other specified diabetes mellitus with unspecified neuropathy"
//             },
//             {
//               "icdCode": "E13.41",
//               "icdCodeDescription": "Other specified diabetes mellitus with diabetic mononeuropathy"
//             },
//             {
//               "icdCode": "E13.42",
//               "icdCodeDescription": "Other specified diabetes mellitus with diabetic polyneuropathy"
//             },
//             {
//               "icdCode": "E14.11",
//               "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, without coma"
//             },
//             {
//               "icdCode": "E13.43",
//               "icdCodeDescription": "Other specified diabetes mellitus with diabetic autonomic neuropathy"
//             },
//             {
//               "icdCode": "E14.10",
//               "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "G59.0",
//               "icdCodeDescription": "Diabetic mononeuropathy"
//             },
//             {
//               "icdCode": "E14.13",
//               "icdCodeDescription": "Unspecified diabetes mellitus with lactic acidosis, without coma"
//             },
//             {
//               "icdCode": "E12.80",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with unspecified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.59",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified circulatory complication"
//             },
//             {
//               "icdCode": "E12.0",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with coma"
//             },
//             {
//               "icdCode": "E14.29",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified renal complication"
//             },
//             {
//               "icdCode": "E12.4",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with neurological complications"
//             },
//             {
//               "icdCode": "E12.81",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with unspecified complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E12.3",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with ophthalmic complications"
//             },
//             {
//               "icdCode": "E13.50",
//               "icdCodeDescription": "Other specified diabetes mellitus with circulatory complication, unspecified"
//             },
//             {
//               "icdCode": "E12.2",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with renal complications"
//             },
//             {
//               "icdCode": "E13.51",
//               "icdCodeDescription": "Other specified diabetes mellitus with peripheral angiopathy without gangrene"
//             },
//             {
//               "icdCode": "E14.20",
//               "icdCodeDescription": "Unspecified diabetes mellitus with renal complication, unspecified"
//             },
//             {
//               "icdCode": "E12.1",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with ketoacidosis"
//             },
//             {
//               "icdCode": "E13.52",
//               "icdCodeDescription": "Other specified diabetes mellitus with peripheral angiopathy with gangrene"
//             },
//             {
//               "icdCode": "E12.8",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with unspecified complications"
//             },
//             {
//               "icdCode": "E13.53",
//               "icdCodeDescription": "Other specified diabetes mellitus with diabetic ischaemic cardiomyopathy"
//             },
//             {
//               "icdCode": "E14.22",
//               "icdCodeDescription": "Unspecified diabetes mellitus with established diabetic nephropathy"
//             },
//             {
//               "icdCode": "E12.7",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with multiple complications"
//             },
//             {
//               "icdCode": "E14.21",
//               "icdCodeDescription": "Unspecified diabetes mellitus with incipient diabetic nephropathy"
//             },
//             {
//               "icdCode": "E12.6",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with other specified complications"
//             },
//             {
//               "icdCode": "E12.5",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with peripheral circulatory complications"
//             },
//             {
//               "icdCode": "E14.23",
//               "icdCodeDescription": "Unspecified diabetes mellitus with advanced renal disease"
//             },
//             {
//               "icdCode": "E12.9",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus without complications"
//             },
//             {
//               "icdCode": "E12.90",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus without complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E12.91",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus without complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.43",
//               "icdCodeDescription": "Type 2 diabetes mellitus with diabetic autonomic neuropathy"
//             },
//             {
//               "icdCode": "E11.42",
//               "icdCodeDescription": "Type 2 diabetes mellitus with diabetic polyneuropathy"
//             },
//             {
//               "icdCode": "E11.41",
//               "icdCodeDescription": "Type 2 diabetes mellitus with diabetic mononeuropathy"
//             },
//             {
//               "icdCode": "E11.40",
//               "icdCodeDescription": "Type 2 diabetes mellitus with unspecified neuropathy"
//             },
//             {
//               "icdCode": "E11.49",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other specified neurological complication"
//             },
//             {
//               "icdCode": "E09.0",
//               "icdCodeDescription": "Impaired glucose regulation with peripheral angiopathy"
//             },
//             {
//               "icdCode": "E12.10",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with ketoacidosis, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E12.11",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with ketoacidosis, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E09.1",
//               "icdCodeDescription": "Impaired glucose regulation with features of insulin resistance"
//             },
//             {
//               "icdCode": "E09.8",
//               "icdCodeDescription": "Impaired glucose regulation with unspecified complication"
//             },
//             {
//               "icdCode": "E09.9",
//               "icdCodeDescription": "Impaired glucose regulation without complication"
//             },
//             {
//               "icdCode": "E11.53",
//               "icdCodeDescription": "Type 2 diabetes mellitus with diabetic ischaemic cardiomyopathy"
//             },
//             {
//               "icdCode": "E11.52",
//               "icdCodeDescription": "Type 2 diabetes mellitus with peripheral angiopathy with gangrene"
//             },
//             {
//               "icdCode": "E11.51",
//               "icdCodeDescription": "Type 2 diabetes mellitus with peripheral angiopathy without gangrene"
//             },
//             {
//               "icdCode": "E11.50",
//               "icdCodeDescription": "Type 2 diabetes mellitus with circulatory complication, unspecified"
//             },
//             {
//               "icdCode": "E13.3",
//               "icdCodeDescription": "Other specified diabetes mellitus with ophthalmic complication"
//             },
//             {
//               "icdCode": "E13.2",
//               "icdCodeDescription": "Other specified diabetes mellitus with renal complication"
//             },
//             {
//               "icdCode": "E13.1",
//               "icdCodeDescription": "Other specified diabetes mellitus with acidosis"
//             },
//             {
//               "icdCode": "E11.59",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other specified circulatory complication"
//             },
//             {
//               "icdCode": "E13.0",
//               "icdCodeDescription": "Other specified diabetes mellitus with hyperosmolarity"
//             },
//             {
//               "icdCode": "E13.7",
//               "icdCodeDescription": "Other specified diabetes mellitus with multiple complications"
//             },
//             {
//               "icdCode": "E12.20",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with renal complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.6",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "E12.21",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with renal complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.5",
//               "icdCodeDescription": "Other specified diabetes mellitus with circulatory complication"
//             },
//             {
//               "icdCode": "E13.4",
//               "icdCodeDescription": "Other specified diabetes mellitus with neurological complication"
//             },
//             {
//               "icdCode": "E13.9",
//               "icdCodeDescription": "Other specified diabetes mellitus without complication"
//             },
//             {
//               "icdCode": "E13.8",
//               "icdCodeDescription": "Other specified diabetes mellitus with unspecified complication"
//             },
//             {
//               "icdCode": "E11.65",
//               "icdCodeDescription": "Type 2 diabetes mellitus with poor control"
//             },
//             {
//               "icdCode": "E13.02",
//               "icdCodeDescription": "Other specified diabetes mellitus with hyperosmolarity, with coma"
//             },
//             {
//               "icdCode": "E11.64",
//               "icdCodeDescription": "Type 2 diabetes mellitus with hypoglycaemia"
//             },
//             {
//               "icdCode": "E11.63",
//               "icdCodeDescription": "Type 2 diabetes mellitus with specified periodontal complication"
//             },
//             {
//               "icdCode": "E11.62",
//               "icdCodeDescription": "Type 2 diabetes mellitus with specified skin and subcutaneous tissue complication"
//             },
//             {
//               "icdCode": "E11.61",
//               "icdCodeDescription": "Type 2 diabetes mellitus with specified diabetic musculoskeletal and connective tissue complication"
//             },
//             {
//               "icdCode": "E11.60",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with other specified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.69",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "E12.30",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with ophthalmic complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "R73",
//               "icdCodeDescription": "Elevated blood glucose level"
//             },
//             {
//               "icdCode": "E12.31",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with ophthalmic complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.00",
//               "icdCodeDescription": "Other specified diabetes mellitus with coma, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.01",
//               "icdCodeDescription": "Other specified diabetes mellitus with hyperosmolarity, without nonketotic hyperglycaemic-hyperosmolar coma [NKHHC]"
//             },
//             {
//               "icdCode": "E13.13",
//               "icdCodeDescription": "Other specified diabetes mellitus with lactic acidosis, without coma"
//             },
//             {
//               "icdCode": "E13.14",
//               "icdCodeDescription": "Other specified diabetes mellitus with lactic acidosis, with coma"
//             },
//             {
//               "icdCode": "H28.0",
//               "icdCodeDescription": "Diabetic cataract"
//             },
//             {
//               "icdCode": "E13.15",
//               "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, with lactic acidosis, without coma"
//             },
//             {
//               "icdCode": "E11.73",
//               "icdCodeDescription": "Type 2 diabetes mellitus with foot ulcer due to multiple causes"
//             },
//             {
//               "icdCode": "E13.16",
//               "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, with lactic acidosis, with coma"
//             },
//             {
//               "icdCode": "E11.72",
//               "icdCodeDescription": "Type 2 diabetes mellitus with features of insulin resistance"
//             },
//             {
//               "icdCode": "E11.71",
//               "icdCodeDescription": "Type 2 diabetes mellitus with multiple microvascular complications"
//             },
//             {
//               "icdCode": "E11.70",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with multiple complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E14.2",
//               "icdCodeDescription": "Unspecified diabetes mellitus with renal complication"
//             },
//             {
//               "icdCode": "E14.1",
//               "icdCodeDescription": "Unspecified diabetes mellitus with acidosis"
//             },
//             {
//               "icdCode": "E14.0",
//               "icdCodeDescription": "Unspecified diabetes mellitus with hyperosmolarity"
//             },
//             {
//               "icdCode": "E12.40",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with neurological complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E12.41",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with neurological complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E14.6",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "E13.10",
//               "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E14.5",
//               "icdCodeDescription": "Unspecified diabetes mellitus with circulatory complication"
//             },
//             {
//               "icdCode": "E13.11",
//               "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, without coma"
//             },
//             {
//               "icdCode": "E14.4",
//               "icdCodeDescription": "Unspecified diabetes mellitus with neurological complication"
//             },
//             {
//               "icdCode": "E13.12",
//               "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, with coma"
//             },
//             {
//               "icdCode": "E14.3",
//               "icdCodeDescription": "Unspecified diabetes mellitus with ophthalmic complication"
//             },
//             {
//               "icdCode": "E14.9",
//               "icdCodeDescription": "Unspecified diabetes mellitus without complication"
//             },
//             {
//               "icdCode": "E14.8",
//               "icdCodeDescription": "Unspecified diabetes mellitus with unspecified complication"
//             },
//             {
//               "icdCode": "E14.7",
//               "icdCodeDescription": "Unspecified diabetes mellitus with multiple complications"
//             },
//             {
//               "icdCode": "E14.73",
//               "icdCodeDescription": "Unspecified diabetes mellitus with foot ulcer due to multiple causes"
//             },
//             {
//               "icdCode": "E14.72",
//               "icdCodeDescription": "Unspecified diabetes mellitus with features of insulin resistance"
//             },
//             {
//               "icdCode": "E11.02",
//               "icdCodeDescription": "Type 2 diabetes mellitus with hyperosmolarity with coma"
//             },
//             {
//               "icdCode": "E11.01",
//               "icdCodeDescription": "Type 2 diabetes mellitus with hyperosmolarity without nonketotic hyperglycaemic-hyperosmolar coma [NKHHC]"
//             },
//             {
//               "icdCode": "E11.00",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with coma, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E14.80",
//               "icdCodeDescription": "Unspecified diabetes mellitus with unspecified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E14.81",
//               "icdCodeDescription": "Unspecified diabetes mellitus with unspecified complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.16",
//               "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, with lactic acidosis, with coma"
//             },
//             {
//               "icdCode": "E11.15",
//               "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, with lactic acidosis, without coma"
//             },
//             {
//               "icdCode": "E11.14",
//               "icdCodeDescription": "Type 2 diabetes mellitus with lactic acidosis, with coma"
//             },
//             {
//               "icdCode": "E09",
//               "icdCodeDescription": "Impaired glucose regulation"
//             },
//             {
//               "icdCode": "E11.13",
//               "icdCodeDescription": "Type 2 diabetes mellitus with lactic acidosis, without coma"
//             },
//             {
//               "icdCode": "E11.12",
//               "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, with coma"
//             },
//             {
//               "icdCode": "E11.11",
//               "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, without coma"
//             },
//             {
//               "icdCode": "E14.91",
//               "icdCodeDescription": "Unspecified diabetes mellitus without complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E14.90",
//               "icdCodeDescription": "Unspecified diabetes mellitus without complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.21",
//               "icdCodeDescription": "Type 2 diabetes mellitus with incipient diabetic nephropathy"
//             },
//             {
//               "icdCode": "E11.20",
//               "icdCodeDescription": "Type 2 diabetes mellitus with renal complication, unspecified"
//             },
//             {
//               "icdCode": "E12",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus"
//             },
//             {
//               "icdCode": "E11",
//               "icdCodeDescription": "Type 2 diabetes mellitus"
//             },
//             {
//               "icdCode": "E14",
//               "icdCodeDescription": "Unspecified diabetes mellitus"
//             },
//             {
//               "icdCode": "E13",
//               "icdCodeDescription": "Other specified diabetes mellitus"
//             },
//             {
//               "icdCode": "M14.2",
//               "icdCodeDescription": "Diabetic arthropathy"
//             },
//             {
//               "icdCode": "E11.29",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other specified renal complication"
//             },
//             {
//               "icdCode": "M10",
//               "icdCodeDescription": "Gout"
//             },
//             {
//               "icdCode": "E11.23",
//               "icdCodeDescription": "Type 2 diabetes mellitus with advanced renal disease"
//             },
//             {
//               "icdCode": "E11.22",
//               "icdCodeDescription": "Type 2 diabetes mellitus with established diabetic nephropathy"
//             },
//             {
//               "icdCode": "N08.3",
//               "icdCodeDescription": "Glomerular disorders in diabetes mellitus (E10-E14+ with common fourth character .2)"
//             },
//             {
//               "icdCode": "E11.32",
//               "icdCodeDescription": "Type 2 diabetes mellitus with preproliferative retinopathy"
//             },
//             {
//               "icdCode": "E11.31",
//               "icdCodeDescription": "Type 2 diabetes mellitus with background retinopathy"
//             },
//             {
//               "icdCode": "E11.30",
//               "icdCodeDescription": "Type 2 diabetes mellitus with ophthalmic complication, unspecified"
//             },
//             {
//               "icdCode": "E11.39",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other specified ophthalmic complication"
//             },
//             {
//               "icdCode": "E11.36",
//               "icdCodeDescription": "Type 2 diabetes mellitus with diabetic cataract"
//             },
//             {
//               "icdCode": "E11.35",
//               "icdCodeDescription": "Type 2 diabetes mellitus with advanced ophthalmic disease"
//             },
//             {
//               "icdCode": "E11.34",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other retinopathy"
//             },
//             {
//               "icdCode": "E11.33",
//               "icdCodeDescription": "Type 2 diabetes mellitus with proliferative retinopathy"
//             },
//             {
//               "icdCode": "E12.00",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with coma, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.69",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "E14.36",
//               "icdCodeDescription": "Unspecified diabetes mellitus with diabetic cataract"
//             },
//             {
//               "icdCode": "E14.39",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified ophthalmic complication"
//             },
//             {
//               "icdCode": "E13.60",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.61",
//               "icdCodeDescription": "Other specified diabetes mellitus with specified diabetic musculoskeletal and connective tissue complication"
//             },
//             {
//               "icdCode": "E13.62",
//               "icdCodeDescription": "Other specified diabetes mellitus with specified skin and subcutaneous tissue complication"
//             },
//             {
//               "icdCode": "E14.31",
//               "icdCodeDescription": "Unspecified diabetes mellitus with background retinopathy"
//             },
//             {
//               "icdCode": "E13.63",
//               "icdCodeDescription": "Other specified diabetes mellitus with specified periodontal complication"
//             },
//             {
//               "icdCode": "E14.30",
//               "icdCodeDescription": "Unspecified diabetes mellitus with ophthalmic complication, unspecified"
//             },
//             {
//               "icdCode": "E13.64",
//               "icdCodeDescription": "Other specified diabetes mellitus with hypoglycaemia"
//             },
//             {
//               "icdCode": "E14.33",
//               "icdCodeDescription": "Unspecified diabetes mellitus with proliferative retinopathy"
//             },
//             {
//               "icdCode": "E13.65",
//               "icdCodeDescription": "Other specified diabetes mellitus with poor control"
//             },
//             {
//               "icdCode": "E14.32",
//               "icdCodeDescription": "Unspecified diabetes mellitus with preproliferative retinopathy"
//             },
//             {
//               "icdCode": "E14.35",
//               "icdCodeDescription": "Unspecified diabetes mellitus with advanced ophthalmic disease"
//             },
//             {
//               "icdCode": "E14.34",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other retinopathy"
//             },
//             {
//               "icdCode": "E13.70",
//               "icdCodeDescription": "Other specified diabetes mellitus with multiple complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E14.49",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified neurological complication"
//             },
//             {
//               "icdCode": "E13.71",
//               "icdCodeDescription": "Other specified diabetes mellitus with multiple microvascular complications"
//             },
//             {
//               "icdCode": "E14.40",
//               "icdCodeDescription": "Unspecified diabetes mellitus with unspecified neuropathy"
//             },
//             {
//               "icdCode": "E13.72",
//               "icdCodeDescription": "Other specified diabetes mellitus with features of insulin resistance"
//             },
//             {
//               "icdCode": "E13.73",
//               "icdCodeDescription": "Other specified diabetes mellitus with foot ulcer due to multiple causes"
//             },
//             {
//               "icdCode": "E14.42",
//               "icdCodeDescription": "Unspecified diabetes mellitus with diabetic polyneuropathy"
//             },
//             {
//               "icdCode": "E14.41",
//               "icdCodeDescription": "Unspecified diabetes mellitus with diabetic mononeuropathy"
//             },
//             {
//               "icdCode": "E14.43",
//               "icdCodeDescription": "Unspecified diabetes mellitus with diabetic autonomic neuropathy"
//             },
//             {
//               "icdCode": "E13.80",
//               "icdCodeDescription": "Other specified diabetes mellitus with unspecified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.81",
//               "icdCodeDescription": "Other specified diabetes mellitus with unspecified complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E14.59",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified circulatory complication"
//             },
//             {
//               "icdCode": "H36.0",
//               "icdCodeDescription": "Diabetic retinopathy"
//             },
//             {
//               "icdCode": "E14.51",
//               "icdCodeDescription": "Unspecified diabetes mellitus with peripheral angiopathy without gangrene"
//             },
//             {
//               "icdCode": "E14.50",
//               "icdCodeDescription": "Unspecified diabetes mellitus with circulatory complication, unspecified"
//             },
//             {
//               "icdCode": "E14.53",
//               "icdCodeDescription": "Unspecified diabetes mellitus with diabetic ischaemic cardiomyopathy"
//             },
//             {
//               "icdCode": "E14.52",
//               "icdCodeDescription": "Unspecified diabetes mellitus with peripheral angiopathy with gangrene"
//             },
//             {
//               "icdCode": "E13.90",
//               "icdCodeDescription": "Other specified diabetes mellitus without complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.91",
//               "icdCodeDescription": "Other specified diabetes mellitus without complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E14.60",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E14.69",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "E14.62",
//               "icdCodeDescription": "Unspecified diabetes mellitus with specified skin and subcutaneous tissue complication"
//             },
//             {
//               "icdCode": "E14.61",
//               "icdCodeDescription": "Unspecified diabetes mellitus with specified diabetic musculoskeletal and connective tissue complication"
//             },
//             {
//               "icdCode": "E14.64",
//               "icdCodeDescription": "Unspecified diabetes mellitus with hypoglycaemia"
//             },
//             {
//               "icdCode": "E14.63",
//               "icdCodeDescription": "Unspecified diabetes mellitus with specified periodontal complication"
//             },
//             {
//               "icdCode": "E14.65",
//               "icdCodeDescription": "Unspecified diabetes mellitus with poor control"
//             },
//             {
//               "icdCode": "E14.71",
//               "icdCodeDescription": "Unspecified diabetes mellitus with multiple microvascular complications"
//             },
//             {
//               "icdCode": "E14.70",
//               "icdCodeDescription": "Unspecified diabetes mellitus with multiple complications, not stated as uncontrolled"
//             }
//           ]
//         }
//       },
//       {
//         "serviceCode": "7-5518-22",
//         "serviceDescription": "Forxiga Tablets 10 mg 28 Tablets",
//         "requestedQuantity": "3",
//         "amount": "159.0",
//         "daysOfSupply": "90",
//         "status": "APPROVED",
//         "request_detail_no": 27015445,
//         "suggestion": {
//           "serviceCode": "7-5518-22",
//           "scientificCode": "7000000346-10-100000073665",
//           "suggestedIcds": [
//             {
//               "icdCode": "E13.29",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified renal complication"
//             },
//             {
//               "icdCode": "E11.81",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with unspecified complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.80",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with unspecified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E12.50",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with peripheral circulatory complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E12.51",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with peripheral circulatory complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.20",
//               "icdCodeDescription": "Other specified diabetes mellitus with renal complication, unspecified"
//             },
//             {
//               "icdCode": "E13.21",
//               "icdCodeDescription": "Other specified diabetes mellitus with incipient diabetic nephropathy"
//             },
//             {
//               "icdCode": "E13.22",
//               "icdCodeDescription": "Other specified diabetes mellitus with established diabetic nephropathy"
//             },
//             {
//               "icdCode": "E13.23",
//               "icdCodeDescription": "Other specified diabetes mellitus with advanced renal disease"
//             },
//             {
//               "icdCode": "N03.1",
//               "icdCodeDescription": "Chronic nephritic syndrome, focal and segmental glomerular lesions"
//             },
//             {
//               "icdCode": "N03.0",
//               "icdCodeDescription": "Chronic nephritic syndrome, minor glomerular abnormality"
//             },
//             {
//               "icdCode": "N03.3",
//               "icdCodeDescription": "Chronic nephritic syndrome, diffuse mesangial proliferative glomerulonephritis"
//             },
//             {
//               "icdCode": "N03.2",
//               "icdCodeDescription": "Chronic nephritic syndrome, diffuse membranous glomerulonephritis"
//             },
//             {
//               "icdCode": "N03.5",
//               "icdCodeDescription": "Chronic nephritic syndrome, diffuse mesangiocapillary glomerulonephritis"
//             },
//             {
//               "icdCode": "N03.4",
//               "icdCodeDescription": "Chronic nephritic syndrome, diffuse endocapillary proliferative glomerulonephritis"
//             },
//             {
//               "icdCode": "E11.90",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus without complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "N03.7",
//               "icdCodeDescription": "Chronic nephritic syndrome, diffuse crescentic glomerulonephritis"
//             },
//             {
//               "icdCode": "N03.6",
//               "icdCodeDescription": "Chronic nephritic syndrome, dense deposit disease"
//             },
//             {
//               "icdCode": "N03.9",
//               "icdCodeDescription": "Chronic nephritic syndrome, unspecified"
//             },
//             {
//               "icdCode": "N03.8",
//               "icdCodeDescription": "Chronic nephritic syndrome, other"
//             },
//             {
//               "icdCode": "E13.35",
//               "icdCodeDescription": "Other specified diabetes mellitus with advanced ophthalmic disease"
//             },
//             {
//               "icdCode": "E13.36",
//               "icdCodeDescription": "Other specified diabetes mellitus with diabetic cataract"
//             },
//             {
//               "icdCode": "E11.1",
//               "icdCodeDescription": "Type 2 diabetes mellitus with acidosis"
//             },
//             {
//               "icdCode": "E13.39",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified ophthalmic complication"
//             },
//             {
//               "icdCode": "E11.0",
//               "icdCodeDescription": "Type 2 diabetes mellitus with hyperosmolarity"
//             },
//             {
//               "icdCode": "G63.2",
//               "icdCodeDescription": "Diabetic polyneuropathy"
//             },
//             {
//               "icdCode": "E11.91",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus without complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.5",
//               "icdCodeDescription": "Type 2 diabetes mellitus with circulatory complciation"
//             },
//             {
//               "icdCode": "E11.4",
//               "icdCodeDescription": "Type 2 diabetes mellitus with neurological complication"
//             },
//             {
//               "icdCode": "E12.60",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with other specified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.3",
//               "icdCodeDescription": "Type 2 diabetes mellitus with ophthalmic complication"
//             },
//             {
//               "icdCode": "E12.61",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with other specified complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "N99.0",
//               "icdCodeDescription": "Postprocedural renal failure"
//             },
//             {
//               "icdCode": "E11.2",
//               "icdCodeDescription": "Type 2 diabetes mellitus with renal complication"
//             },
//             {
//               "icdCode": "E13.30",
//               "icdCodeDescription": "Other specified diabetes mellitus with ophthalmic complication, unspecified"
//             },
//             {
//               "icdCode": "E11.9",
//               "icdCodeDescription": "Type 2 diabetes mellitus without complication"
//             },
//             {
//               "icdCode": "E13.31",
//               "icdCodeDescription": "Other specified diabetes mellitus with background retinopathy"
//             },
//             {
//               "icdCode": "E14.00",
//               "icdCodeDescription": "Unspecified diabetes mellitus with coma, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.8",
//               "icdCodeDescription": "Type 2 diabetes mellitus with unspecified complication"
//             },
//             {
//               "icdCode": "E13.32",
//               "icdCodeDescription": "Other specified diabetes mellitus with preproliferative retinopathy"
//             },
//             {
//               "icdCode": "E11.7",
//               "icdCodeDescription": "Type 2 diabetes mellitus with multiple complications"
//             },
//             {
//               "icdCode": "E13.33",
//               "icdCodeDescription": "Other specified diabetes mellitus with proliferative retinopathy"
//             },
//             {
//               "icdCode": "E14.02",
//               "icdCodeDescription": "Unspecified diabetes mellitus with hyperosmolarity, with coma"
//             },
//             {
//               "icdCode": "E11.6",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "E13.34",
//               "icdCodeDescription": "Other specified diabetes mellitus with other retinopathy"
//             },
//             {
//               "icdCode": "E14.01",
//               "icdCodeDescription": "Unspecified diabetes mellitus with hyperosmolarity, without nonketotic hyperglycaemic-hyperosmolar coma [NKHHC]"
//             },
//             {
//               "icdCode": "I82.8",
//               "icdCodeDescription": "Embolism and thrombosis of other specified veins"
//             },
//             {
//               "icdCode": "E14.15",
//               "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, with lactic acidosis, without coma"
//             },
//             {
//               "icdCode": "E14.14",
//               "icdCodeDescription": "Unspecified diabetes mellitus with lactic acidosis, with coma"
//             },
//             {
//               "icdCode": "E13.49",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified neurological complication"
//             },
//             {
//               "icdCode": "E14.16",
//               "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, with lactic acidosis, with coma"
//             },
//             {
//               "icdCode": "E12.70",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with multiple complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "I12",
//               "icdCodeDescription": "Hypertensive renal disease"
//             },
//             {
//               "icdCode": "E12.71",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with multiple complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.40",
//               "icdCodeDescription": "Other specified diabetes mellitus with unspecified neuropathy"
//             },
//             {
//               "icdCode": "I25.11",
//               "icdCodeDescription": "Atherosclerotic heart disease, of native coronary artery"
//             },
//             {
//               "icdCode": "E13.41",
//               "icdCodeDescription": "Other specified diabetes mellitus with diabetic mononeuropathy"
//             },
//             {
//               "icdCode": "I13",
//               "icdCodeDescription": "Hypertensive heart and renal disease"
//             },
//             {
//               "icdCode": "E13.42",
//               "icdCodeDescription": "Other specified diabetes mellitus with diabetic polyneuropathy"
//             },
//             {
//               "icdCode": "E14.11",
//               "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, without coma"
//             },
//             {
//               "icdCode": "E13.43",
//               "icdCodeDescription": "Other specified diabetes mellitus with diabetic autonomic neuropathy"
//             },
//             {
//               "icdCode": "E14.10",
//               "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "G59.0",
//               "icdCodeDescription": "Diabetic mononeuropathy"
//             },
//             {
//               "icdCode": "E14.13",
//               "icdCodeDescription": "Unspecified diabetes mellitus with lactic acidosis, without coma"
//             },
//             {
//               "icdCode": "N04.0",
//               "icdCodeDescription": "Nephrotic syndrome, minor glomerular abnormality"
//             },
//             {
//               "icdCode": "N04.2",
//               "icdCodeDescription": "Nephrotic syndrome, diffuse membranous glomerulonephritis"
//             },
//             {
//               "icdCode": "N04.1",
//               "icdCodeDescription": "Nephrotic syndrome, focal and segmental glomerular lesions"
//             },
//             {
//               "icdCode": "N04.4",
//               "icdCodeDescription": "Nephrotic syndrome, diffuse endocapillary proliferative glomerulonephritis"
//             },
//             {
//               "icdCode": "Z95.1",
//               "icdCodeDescription": "Presence of aortocoronary bypass graft"
//             },
//             {
//               "icdCode": "E12.80",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with unspecified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "N04.3",
//               "icdCodeDescription": "Nephrotic syndrome, diffuse mesangial proliferative glomerulonephritis"
//             },
//             {
//               "icdCode": "N04.6",
//               "icdCodeDescription": "Nephrotic syndrome, dense deposit disease"
//             },
//             {
//               "icdCode": "N04.5",
//               "icdCodeDescription": "Nephrotic syndrome, diffuse mesangiocapillary glomerulonephritis"
//             },
//             {
//               "icdCode": "N04.8",
//               "icdCodeDescription": "Nephrotic syndrome, other"
//             },
//             {
//               "icdCode": "N04.7",
//               "icdCodeDescription": "Nephrotic syndrome, diffuse crescentic glomerulonephritis"
//             },
//             {
//               "icdCode": "N04.9",
//               "icdCodeDescription": "Nephrotic syndrome, unspecified"
//             },
//             {
//               "icdCode": "E13.59",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified circulatory complication"
//             },
//             {
//               "icdCode": "E12.0",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with coma"
//             },
//             {
//               "icdCode": "E14.29",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified renal complication"
//             },
//             {
//               "icdCode": "I21",
//               "icdCodeDescription": "Acute myocardial infarction"
//             },
//             {
//               "icdCode": "I20",
//               "icdCodeDescription": "Angina pectoris"
//             },
//             {
//               "icdCode": "E12.4",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with neurological complications"
//             },
//             {
//               "icdCode": "E12.81",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with unspecified complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E12.3",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with ophthalmic complications"
//             },
//             {
//               "icdCode": "E13.50",
//               "icdCodeDescription": "Other specified diabetes mellitus with circulatory complication, unspecified"
//             },
//             {
//               "icdCode": "E12.2",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with renal complications"
//             },
//             {
//               "icdCode": "E13.51",
//               "icdCodeDescription": "Other specified diabetes mellitus with peripheral angiopathy without gangrene"
//             },
//             {
//               "icdCode": "E14.20",
//               "icdCodeDescription": "Unspecified diabetes mellitus with renal complication, unspecified"
//             },
//             {
//               "icdCode": "E12.1",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with ketoacidosis"
//             },
//             {
//               "icdCode": "E13.52",
//               "icdCodeDescription": "Other specified diabetes mellitus with peripheral angiopathy with gangrene"
//             },
//             {
//               "icdCode": "E12.8",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with unspecified complications"
//             },
//             {
//               "icdCode": "E13.53",
//               "icdCodeDescription": "Other specified diabetes mellitus with diabetic ischaemic cardiomyopathy"
//             },
//             {
//               "icdCode": "E14.22",
//               "icdCodeDescription": "Unspecified diabetes mellitus with established diabetic nephropathy"
//             },
//             {
//               "icdCode": "E12.7",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with multiple complications"
//             },
//             {
//               "icdCode": "E14.21",
//               "icdCodeDescription": "Unspecified diabetes mellitus with incipient diabetic nephropathy"
//             },
//             {
//               "icdCode": "I20.9",
//               "icdCodeDescription": "Angina pectoris, unspecified"
//             },
//             {
//               "icdCode": "E12.6",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with other specified complications"
//             },
//             {
//               "icdCode": "E12.5",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with peripheral circulatory complications"
//             },
//             {
//               "icdCode": "E14.23",
//               "icdCodeDescription": "Unspecified diabetes mellitus with advanced renal disease"
//             },
//             {
//               "icdCode": "E12.9",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus without complications"
//             },
//             {
//               "icdCode": "I20.0",
//               "icdCodeDescription": "Unstable angina"
//             },
//             {
//               "icdCode": "E12.90",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus without complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E12.91",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus without complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "O90.4",
//               "icdCodeDescription": "Postpartum acute renal failure"
//             },
//             {
//               "icdCode": "E11.43",
//               "icdCodeDescription": "Type 2 diabetes mellitus with diabetic autonomic neuropathy"
//             },
//             {
//               "icdCode": "E11.42",
//               "icdCodeDescription": "Type 2 diabetes mellitus with diabetic polyneuropathy"
//             },
//             {
//               "icdCode": "E11.41",
//               "icdCodeDescription": "Type 2 diabetes mellitus with diabetic mononeuropathy"
//             },
//             {
//               "icdCode": "E10.73",
//               "icdCodeDescription": "Type 1 diabetes mellitus with foot ulcer due to multiple causes"
//             },
//             {
//               "icdCode": "E11.40",
//               "icdCodeDescription": "Type 2 diabetes mellitus with unspecified neuropathy"
//             },
//             {
//               "icdCode": "E10.71",
//               "icdCodeDescription": "Type 1 diabetes mellitus with multiple microvascular complications"
//             },
//             {
//               "icdCode": "E10.70",
//               "icdCodeDescription": "Insulin-dependent diabetes mellitus with multiple complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.49",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other specified neurological complication"
//             },
//             {
//               "icdCode": "E09.0",
//               "icdCodeDescription": "Impaired glucose regulation with peripheral angiopathy"
//             },
//             {
//               "icdCode": "P96.0",
//               "icdCodeDescription": "Congenital renal failure"
//             },
//             {
//               "icdCode": "E12.10",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with ketoacidosis, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E12.11",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with ketoacidosis, stated as uncontrolled"
//             },
//             {
//               "icdCode": "N01.1",
//               "icdCodeDescription": "Rapidly progressive nephritic syndrome, focal and segmental glomerular lesions"
//             },
//             {
//               "icdCode": "N01.0",
//               "icdCodeDescription": "Rapidly progressive nephritic syndrome, minor glomerular abnormality"
//             },
//             {
//               "icdCode": "N01.3",
//               "icdCodeDescription": "Rapidly progressive nephritic syndrome, diffuse mesangial proliferative glomerulonephritis"
//             },
//             {
//               "icdCode": "E09.1",
//               "icdCodeDescription": "Impaired glucose regulation with features of insulin resistance"
//             },
//             {
//               "icdCode": "N01.2",
//               "icdCodeDescription": "Rapidly progressive nephritic syndrome, diffuse membranous glomerulonephritis"
//             },
//             {
//               "icdCode": "E09.8",
//               "icdCodeDescription": "Impaired glucose regulation with unspecified complication"
//             },
//             {
//               "icdCode": "N01.5",
//               "icdCodeDescription": "Rapidly progressive nephritic syndrome, diffuse mesangiocapillary glomerulonephritis"
//             },
//             {
//               "icdCode": "N01.4",
//               "icdCodeDescription": "Rapidly progressive nephritic syndrome, diffuse endocapillary proliferative glomerulonephritis"
//             },
//             {
//               "icdCode": "N01.7",
//               "icdCodeDescription": "Rapidly progressive nephritic syndrome, diffuse crescentic glomerulonephritis"
//             },
//             {
//               "icdCode": "N01.6",
//               "icdCodeDescription": "Rapidly progressive nephritic syndrome, dense deposit disease"
//             },
//             {
//               "icdCode": "N01.9",
//               "icdCodeDescription": "Rapidly progressive nephritic syndrome, unspecified"
//             },
//             {
//               "icdCode": "N01.8",
//               "icdCodeDescription": "Rapidly progressive nephritic syndrome, other"
//             },
//             {
//               "icdCode": "E09.9",
//               "icdCodeDescription": "Impaired glucose regulation without complication"
//             },
//             {
//               "icdCode": "E11.53",
//               "icdCodeDescription": "Type 2 diabetes mellitus with diabetic ischaemic cardiomyopathy"
//             },
//             {
//               "icdCode": "E11.52",
//               "icdCodeDescription": "Type 2 diabetes mellitus with peripheral angiopathy with gangrene"
//             },
//             {
//               "icdCode": "E11.51",
//               "icdCodeDescription": "Type 2 diabetes mellitus with peripheral angiopathy without gangrene"
//             },
//             {
//               "icdCode": "E11.50",
//               "icdCodeDescription": "Type 2 diabetes mellitus with circulatory complication, unspecified"
//             },
//             {
//               "icdCode": "E10.81",
//               "icdCodeDescription": "Insulin-dependent diabetes mellitus with unspecified complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E10.80",
//               "icdCodeDescription": "Insulin-dependent diabetes mellitus with unspecified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "I42",
//               "icdCodeDescription": "Cardiomyopathy"
//             },
//             {
//               "icdCode": "E13.3",
//               "icdCodeDescription": "Other specified diabetes mellitus with ophthalmic complication"
//             },
//             {
//               "icdCode": "E13.2",
//               "icdCodeDescription": "Other specified diabetes mellitus with renal complication"
//             },
//             {
//               "icdCode": "E13.1",
//               "icdCodeDescription": "Other specified diabetes mellitus with acidosis"
//             },
//             {
//               "icdCode": "E11.59",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other specified circulatory complication"
//             },
//             {
//               "icdCode": "E13.0",
//               "icdCodeDescription": "Other specified diabetes mellitus with hyperosmolarity"
//             },
//             {
//               "icdCode": "E13.7",
//               "icdCodeDescription": "Other specified diabetes mellitus with multiple complications"
//             },
//             {
//               "icdCode": "E12.20",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with renal complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.6",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "E12.21",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with renal complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.5",
//               "icdCodeDescription": "Other specified diabetes mellitus with circulatory complication"
//             },
//             {
//               "icdCode": "E13.4",
//               "icdCodeDescription": "Other specified diabetes mellitus with neurological complication"
//             },
//             {
//               "icdCode": "E13.9",
//               "icdCodeDescription": "Other specified diabetes mellitus without complication"
//             },
//             {
//               "icdCode": "E13.8",
//               "icdCodeDescription": "Other specified diabetes mellitus with unspecified complication"
//             },
//             {
//               "icdCode": "I42.0",
//               "icdCodeDescription": "Dilated cardiomyopathy"
//             },
//             {
//               "icdCode": "E11.65",
//               "icdCodeDescription": "Type 2 diabetes mellitus with poor control"
//             },
//             {
//               "icdCode": "E13.02",
//               "icdCodeDescription": "Other specified diabetes mellitus with hyperosmolarity, with coma"
//             },
//             {
//               "icdCode": "E11.64",
//               "icdCodeDescription": "Type 2 diabetes mellitus with hypoglycaemia"
//             },
//             {
//               "icdCode": "E11.63",
//               "icdCodeDescription": "Type 2 diabetes mellitus with specified periodontal complication"
//             },
//             {
//               "icdCode": "I50",
//               "icdCodeDescription": "Heart failure"
//             },
//             {
//               "icdCode": "E11.62",
//               "icdCodeDescription": "Type 2 diabetes mellitus with specified skin and subcutaneous tissue complication"
//             },
//             {
//               "icdCode": "E11.61",
//               "icdCodeDescription": "Type 2 diabetes mellitus with specified diabetic musculoskeletal and connective tissue complication"
//             },
//             {
//               "icdCode": "E11.60",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with other specified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E10.91",
//               "icdCodeDescription": "Insulin-dependent diabetes mellitus without complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.69",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "E12.30",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with ophthalmic complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "R73",
//               "icdCodeDescription": "Elevated blood glucose level"
//             },
//             {
//               "icdCode": "E12.31",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with ophthalmic complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.00",
//               "icdCodeDescription": "Other specified diabetes mellitus with coma, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.01",
//               "icdCodeDescription": "Other specified diabetes mellitus with hyperosmolarity, without nonketotic hyperglycaemic-hyperosmolar coma [NKHHC]"
//             },
//             {
//               "icdCode": "N02.2",
//               "icdCodeDescription": "Recurrent and persistent haematuria, diffuse membranous glomerulonephritis"
//             },
//             {
//               "icdCode": "N02.1",
//               "icdCodeDescription": "Recurrent and persistent haematuria, focal and segmental glomerular lesions"
//             },
//             {
//               "icdCode": "N02.4",
//               "icdCodeDescription": "Recurrent and persistent haematuria, diffuse endocapillary proliferative glomerulonephritis"
//             },
//             {
//               "icdCode": "N02.3",
//               "icdCodeDescription": "Recurrent and persistent haematuria, diffuse mesangial proliferative glomerulonephritis"
//             },
//             {
//               "icdCode": "N02.5",
//               "icdCodeDescription": "Recurrent and persistent haematuria, diffuse mesangiocapillary glomerulonephritis"
//             },
//             {
//               "icdCode": "N02.7",
//               "icdCodeDescription": "Recurrent and persistent haematuria, diffuse crescentic glomerulonephritis"
//             },
//             {
//               "icdCode": "E13.13",
//               "icdCodeDescription": "Other specified diabetes mellitus with lactic acidosis, without coma"
//             },
//             {
//               "icdCode": "E13.14",
//               "icdCodeDescription": "Other specified diabetes mellitus with lactic acidosis, with coma"
//             },
//             {
//               "icdCode": "H28.0",
//               "icdCodeDescription": "Diabetic cataract"
//             },
//             {
//               "icdCode": "E13.15",
//               "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, with lactic acidosis, without coma"
//             },
//             {
//               "icdCode": "E11.73",
//               "icdCodeDescription": "Type 2 diabetes mellitus with foot ulcer due to multiple causes"
//             },
//             {
//               "icdCode": "E13.16",
//               "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, with lactic acidosis, with coma"
//             },
//             {
//               "icdCode": "E11.72",
//               "icdCodeDescription": "Type 2 diabetes mellitus with features of insulin resistance"
//             },
//             {
//               "icdCode": "E11.71",
//               "icdCodeDescription": "Type 2 diabetes mellitus with multiple microvascular complications"
//             },
//             {
//               "icdCode": "E11.70",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with multiple complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "I64",
//               "icdCodeDescription": "Stroke, not specified as haemorrhage or infarction"
//             },
//             {
//               "icdCode": "E14.2",
//               "icdCodeDescription": "Unspecified diabetes mellitus with renal complication"
//             },
//             {
//               "icdCode": "E14.1",
//               "icdCodeDescription": "Unspecified diabetes mellitus with acidosis"
//             },
//             {
//               "icdCode": "E14.0",
//               "icdCodeDescription": "Unspecified diabetes mellitus with hyperosmolarity"
//             },
//             {
//               "icdCode": "E12.40",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with neurological complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E12.41",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with neurological complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E14.6",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "E13.10",
//               "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E14.5",
//               "icdCodeDescription": "Unspecified diabetes mellitus with circulatory complication"
//             },
//             {
//               "icdCode": "E13.11",
//               "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, without coma"
//             },
//             {
//               "icdCode": "E14.4",
//               "icdCodeDescription": "Unspecified diabetes mellitus with neurological complication"
//             },
//             {
//               "icdCode": "E13.12",
//               "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, with coma"
//             },
//             {
//               "icdCode": "E14.3",
//               "icdCodeDescription": "Unspecified diabetes mellitus with ophthalmic complication"
//             },
//             {
//               "icdCode": "E14.9",
//               "icdCodeDescription": "Unspecified diabetes mellitus without complication"
//             },
//             {
//               "icdCode": "E14.8",
//               "icdCodeDescription": "Unspecified diabetes mellitus with unspecified complication"
//             },
//             {
//               "icdCode": "E14.7",
//               "icdCodeDescription": "Unspecified diabetes mellitus with multiple complications"
//             },
//             {
//               "icdCode": "N08",
//               "icdCodeDescription": "Glomerular disorders in diseases classified elsewhere"
//             },
//             {
//               "icdCode": "E10.31",
//               "icdCodeDescription": "Type 1 diabetes mellitus with background retinopathy"
//             },
//             {
//               "icdCode": "I70",
//               "icdCodeDescription": "Atherosclerosis"
//             },
//             {
//               "icdCode": "E14.73",
//               "icdCodeDescription": "Unspecified diabetes mellitus with foot ulcer due to multiple causes"
//             },
//             {
//               "icdCode": "E14.72",
//               "icdCodeDescription": "Unspecified diabetes mellitus with features of insulin resistance"
//             },
//             {
//               "icdCode": "E11.02",
//               "icdCodeDescription": "Type 2 diabetes mellitus with hyperosmolarity with coma"
//             },
//             {
//               "icdCode": "T86.1",
//               "icdCodeDescription": "Kidney transplant failure and rejection"
//             },
//             {
//               "icdCode": "E11.01",
//               "icdCodeDescription": "Type 2 diabetes mellitus with hyperosmolarity without nonketotic hyperglycaemic-hyperosmolar coma [NKHHC]"
//             },
//             {
//               "icdCode": "E11.00",
//               "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with coma, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "N17",
//               "icdCodeDescription": "Acute renal failure"
//             },
//             {
//               "icdCode": "E14.80",
//               "icdCodeDescription": "Unspecified diabetes mellitus with unspecified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "N19",
//               "icdCodeDescription": "Unspecified renal failure"
//             },
//             {
//               "icdCode": "N18",
//               "icdCodeDescription": "Chronic renal failure"
//             },
//             {
//               "icdCode": "N07.1",
//               "icdCodeDescription": "Hereditary nephropathy, not elsewhere classified, focal and segmental glomerular lesions"
//             },
//             {
//               "icdCode": "E14.81",
//               "icdCodeDescription": "Unspecified diabetes mellitus with unspecified complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "N07.0",
//               "icdCodeDescription": "Hereditary nephropathy, not elsewhere classified, minor glomerular abnormality"
//             },
//             {
//               "icdCode": "N07.3",
//               "icdCodeDescription": "Hereditary nephropathy, not elsewhere classified, diffuse mesangial proliferative glomerulonephritis"
//             },
//             {
//               "icdCode": "N07.2",
//               "icdCodeDescription": "Hereditary nephropathy, not elsewhere classified, diffuse membranous glomerulonephritis"
//             },
//             {
//               "icdCode": "N07.5",
//               "icdCodeDescription": "Hereditary nephropathy, not elsewhere classified, diffuse mesangiocapillary glomerulonephritis"
//             },
//             {
//               "icdCode": "N07.4",
//               "icdCodeDescription": "Hereditary nephropathy, not elsewhere classified, diffuse endocapillary proliferative glomerulonephritis"
//             },
//             {
//               "icdCode": "N07.7",
//               "icdCodeDescription": "Hereditary nephropathy, not elsewhere classified, diffuse crescentic glomerulonephritis"
//             },
//             {
//               "icdCode": "N07.6",
//               "icdCodeDescription": "Hereditary nephropathy, not elsewhere classified, dense deposit disease"
//             },
//             {
//               "icdCode": "N07.9",
//               "icdCodeDescription": "Hereditary nephropathy, not elsewhere classified, unspecified"
//             },
//             {
//               "icdCode": "N07.8",
//               "icdCodeDescription": "Hereditary nephropathy, not elsewhere classified, other"
//             },
//             {
//               "icdCode": "E10.42",
//               "icdCodeDescription": "Type 1 diabetes mellitus with diabetic polyneuropathy"
//             },
//             {
//               "icdCode": "E10.41",
//               "icdCodeDescription": "Type 1 diabetes mellitus with diabetic mononeuropathy"
//             },
//             {
//               "icdCode": "E10.40",
//               "icdCodeDescription": "Type 1 diabetes mellitus with unspecified neuropathy"
//             },
//             {
//               "icdCode": "N18.90",
//               "icdCodeDescription": "Unspecified chronic renal failure"
//             },
//             {
//               "icdCode": "I25.8",
//               "icdCodeDescription": "Other forms of chronic ischaemic heart disease"
//             },
//             {
//               "icdCode": "E11.16",
//               "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, with lactic acidosis, with coma"
//             },
//             {
//               "icdCode": "E11.15",
//               "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, with lactic acidosis, without coma"
//             },
//             {
//               "icdCode": "E11.14",
//               "icdCodeDescription": "Type 2 diabetes mellitus with lactic acidosis, with coma"
//             },
//             {
//               "icdCode": "E09",
//               "icdCodeDescription": "Impaired glucose regulation"
//             },
//             {
//               "icdCode": "E11.13",
//               "icdCodeDescription": "Type 2 diabetes mellitus with lactic acidosis, without coma"
//             },
//             {
//               "icdCode": "E11.12",
//               "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, with coma"
//             },
//             {
//               "icdCode": "I25.5",
//               "icdCodeDescription": "Ischaemic cardiomyopathy"
//             },
//             {
//               "icdCode": "E11.11",
//               "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, without coma"
//             },
//             {
//               "icdCode": "E14.91",
//               "icdCodeDescription": "Unspecified diabetes mellitus without complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E14.90",
//               "icdCodeDescription": "Unspecified diabetes mellitus without complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "N18.91",
//               "icdCodeDescription": "Chronic renal impairment"
//             },
//             {
//               "icdCode": "E11.21",
//               "icdCodeDescription": "Type 2 diabetes mellitus with incipient diabetic nephropathy"
//             },
//             {
//               "icdCode": "E11.20",
//               "icdCodeDescription": "Type 2 diabetes mellitus with renal complication, unspecified"
//             },
//             {
//               "icdCode": "E10",
//               "icdCodeDescription": "Type 1 diabetes mellitus"
//             },
//             {
//               "icdCode": "E12",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus"
//             },
//             {
//               "icdCode": "E11",
//               "icdCodeDescription": "Type 2 diabetes mellitus"
//             },
//             {
//               "icdCode": "E14",
//               "icdCodeDescription": "Unspecified diabetes mellitus"
//             },
//             {
//               "icdCode": "E13",
//               "icdCodeDescription": "Other specified diabetes mellitus"
//             },
//             {
//               "icdCode": "M14.2",
//               "icdCodeDescription": "Diabetic arthropathy"
//             },
//             {
//               "icdCode": "E11.29",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other specified renal complication"
//             },
//             {
//               "icdCode": "E11.23",
//               "icdCodeDescription": "Type 2 diabetes mellitus with advanced renal disease"
//             },
//             {
//               "icdCode": "I13.9",
//               "icdCodeDescription": "Hypertensive heart and renal disease, unspecified"
//             },
//             {
//               "icdCode": "N00.0",
//               "icdCodeDescription": "Acute nephritic syndrome, minor glomerular abnormality"
//             },
//             {
//               "icdCode": "E11.22",
//               "icdCodeDescription": "Type 2 diabetes mellitus with established diabetic nephropathy"
//             },
//             {
//               "icdCode": "N00.2",
//               "icdCodeDescription": "Acute nephritic syndrome, diffuse membranous glomerulonephritis"
//             },
//             {
//               "icdCode": "N00.1",
//               "icdCodeDescription": "Acute nephritic syndrome, focal and segmental glomerular lesions"
//             },
//             {
//               "icdCode": "N00.4",
//               "icdCodeDescription": "Acute nephritic syndrome, diffuse endocapillary proliferative glomerulonephritis"
//             },
//             {
//               "icdCode": "I51.9",
//               "icdCodeDescription": "Heart disease, unspecified"
//             },
//             {
//               "icdCode": "N00.3",
//               "icdCodeDescription": "Acute nephritic syndrome, diffuse mesangial proliferative glomerulonephritis"
//             },
//             {
//               "icdCode": "N00.6",
//               "icdCodeDescription": "Acute nephritic syndrome, dense deposit disease"
//             },
//             {
//               "icdCode": "I13.2",
//               "icdCodeDescription": "Hypertensive heart and renal disease with both (congestive) heart failure and renal failure"
//             },
//             {
//               "icdCode": "N00.5",
//               "icdCodeDescription": "Acute nephritic syndrome, diffuse mesangiocapillary glomerulonephritis"
//             },
//             {
//               "icdCode": "I13.1",
//               "icdCodeDescription": "Hypertensive heart and renal disease with renal failure"
//             },
//             {
//               "icdCode": "N00.8",
//               "icdCodeDescription": "Acute nephritic syndrome, other"
//             },
//             {
//               "icdCode": "N08.0",
//               "icdCodeDescription": "Glomerular disorders in infectious and parasitic diseases classified elsewhere"
//             },
//             {
//               "icdCode": "I13.0",
//               "icdCodeDescription": "Hypertensive heart and renal disease with (congestive) heart failure"
//             },
//             {
//               "icdCode": "N00.7",
//               "icdCodeDescription": "Acute nephritic syndrome, diffuse crescentic glomerulonephritis"
//             },
//             {
//               "icdCode": "N08.2",
//               "icdCodeDescription": "Glomerular disorders in blood diseases and disorders involving the immune mechanism"
//             },
//             {
//               "icdCode": "N00.9",
//               "icdCodeDescription": "Acute nephritic syndrome, unspecified"
//             },
//             {
//               "icdCode": "N08.1",
//               "icdCodeDescription": "Glomerular disorders in neoplastic diseases"
//             },
//             {
//               "icdCode": "N08.4",
//               "icdCodeDescription": "Glomerular disorders in endocrine, nutritional and metabolic diseases"
//             },
//             {
//               "icdCode": "N08.3",
//               "icdCodeDescription": "Glomerular disorders in diabetes mellitus (E10-E14+ with common fourth character .2)"
//             },
//             {
//               "icdCode": "N08.5",
//               "icdCodeDescription": "Glomerular disorders in systemic connective tissue disorders"
//             },
//             {
//               "icdCode": "N08.8",
//               "icdCodeDescription": "Glomerular disorders in other diseases classified elsewhere"
//             },
//             {
//               "icdCode": "E11.32",
//               "icdCodeDescription": "Type 2 diabetes mellitus with preproliferative retinopathy"
//             },
//             {
//               "icdCode": "E10.64",
//               "icdCodeDescription": "Type 1 diabetes mellitus with hypoglycaemia"
//             },
//             {
//               "icdCode": "E11.31",
//               "icdCodeDescription": "Type 2 diabetes mellitus with background retinopathy"
//             },
//             {
//               "icdCode": "E11.30",
//               "icdCodeDescription": "Type 2 diabetes mellitus with ophthalmic complication, unspecified"
//             },
//             {
//               "icdCode": "E10.60",
//               "icdCodeDescription": "Insulin-dependent diabetes mellitus with other specified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E11.39",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other specified ophthalmic complication"
//             },
//             {
//               "icdCode": "I24.9",
//               "icdCodeDescription": "Acute ischaemic heart disease, unspecified"
//             },
//             {
//               "icdCode": "E11.36",
//               "icdCodeDescription": "Type 2 diabetes mellitus with diabetic cataract"
//             },
//             {
//               "icdCode": "E11.35",
//               "icdCodeDescription": "Type 2 diabetes mellitus with advanced ophthalmic disease"
//             },
//             {
//               "icdCode": "E11.34",
//               "icdCodeDescription": "Type 2 diabetes mellitus with other retinopathy"
//             },
//             {
//               "icdCode": "E11.33",
//               "icdCodeDescription": "Type 2 diabetes mellitus with proliferative retinopathy"
//             },
//             {
//               "icdCode": "E12.00",
//               "icdCodeDescription": "Malnutrition-related diabetes mellitus with coma, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E10.65",
//               "icdCodeDescription": "Type 1 diabetes mellitus with poor control"
//             },
//             {
//               "icdCode": "E13.69",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "E14.36",
//               "icdCodeDescription": "Unspecified diabetes mellitus with diabetic cataract"
//             },
//             {
//               "icdCode": "E14.39",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified ophthalmic complication"
//             },
//             {
//               "icdCode": "R73.9",
//               "icdCodeDescription": "Hyperglycaemia, unspecified"
//             },
//             {
//               "icdCode": "E13.60",
//               "icdCodeDescription": "Other specified diabetes mellitus with other specified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.61",
//               "icdCodeDescription": "Other specified diabetes mellitus with specified diabetic musculoskeletal and connective tissue complication"
//             },
//             {
//               "icdCode": "E13.62",
//               "icdCodeDescription": "Other specified diabetes mellitus with specified skin and subcutaneous tissue complication"
//             },
//             {
//               "icdCode": "E14.31",
//               "icdCodeDescription": "Unspecified diabetes mellitus with background retinopathy"
//             },
//             {
//               "icdCode": "E13.63",
//               "icdCodeDescription": "Other specified diabetes mellitus with specified periodontal complication"
//             },
//             {
//               "icdCode": "E14.30",
//               "icdCodeDescription": "Unspecified diabetes mellitus with ophthalmic complication, unspecified"
//             },
//             {
//               "icdCode": "E13.64",
//               "icdCodeDescription": "Other specified diabetes mellitus with hypoglycaemia"
//             },
//             {
//               "icdCode": "E14.33",
//               "icdCodeDescription": "Unspecified diabetes mellitus with proliferative retinopathy"
//             },
//             {
//               "icdCode": "E13.65",
//               "icdCodeDescription": "Other specified diabetes mellitus with poor control"
//             },
//             {
//               "icdCode": "E14.32",
//               "icdCodeDescription": "Unspecified diabetes mellitus with preproliferative retinopathy"
//             },
//             {
//               "icdCode": "E14.35",
//               "icdCodeDescription": "Unspecified diabetes mellitus with advanced ophthalmic disease"
//             },
//             {
//               "icdCode": "E14.34",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other retinopathy"
//             },
//             {
//               "icdCode": "I12.9",
//               "icdCodeDescription": "Hypertensive renal disease without renal failure"
//             },
//             {
//               "icdCode": "I12.0",
//               "icdCodeDescription": "Hypertensive renal disease with renal failure"
//             },
//             {
//               "icdCode": "I50.9",
//               "icdCodeDescription": "Heart failure, unspecified"
//             },
//             {
//               "icdCode": "N05.1",
//               "icdCodeDescription": "Unspecified nephritic syndrome, focal and segmental glomerular lesions"
//             },
//             {
//               "icdCode": "N05.0",
//               "icdCodeDescription": "Unspecified nephritic syndrome, minor glomerular abnormality"
//             },
//             {
//               "icdCode": "N05.3",
//               "icdCodeDescription": "Unspecified nephritic syndrome, diffuse mesangial proliferative glomerulonephritis"
//             },
//             {
//               "icdCode": "E13.70",
//               "icdCodeDescription": "Other specified diabetes mellitus with multiple complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "N05.2",
//               "icdCodeDescription": "Unspecified nephritic syndrome, diffuse membranous glomerulonephritis"
//             },
//             {
//               "icdCode": "N05.5",
//               "icdCodeDescription": "Unspecified nephritic syndrome, diffuse mesangiocapillary glomerulonephritis"
//             },
//             {
//               "icdCode": "I50.0",
//               "icdCodeDescription": "Congestive heart failure"
//             },
//             {
//               "icdCode": "N05.4",
//               "icdCodeDescription": "Unspecified nephritic syndrome, diffuse endocapillary proliferative glomerulonephritis"
//             },
//             {
//               "icdCode": "N05.7",
//               "icdCodeDescription": "Unspecified nephritic syndrome, diffuse crescentic glomerulonephritis"
//             },
//             {
//               "icdCode": "N05.6",
//               "icdCodeDescription": "Unspecified nephritic syndrome, dense deposit disease"
//             },
//             {
//               "icdCode": "I50.1",
//               "icdCodeDescription": "Left ventricular failure"
//             },
//             {
//               "icdCode": "N05.9",
//               "icdCodeDescription": "Unspecified nephritic syndrome, unspecified"
//             },
//             {
//               "icdCode": "N05.8",
//               "icdCodeDescription": "Unspecified nephritic syndrome, other"
//             },
//             {
//               "icdCode": "E14.49",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified neurological complication"
//             },
//             {
//               "icdCode": "E13.71",
//               "icdCodeDescription": "Other specified diabetes mellitus with multiple microvascular complications"
//             },
//             {
//               "icdCode": "E14.40",
//               "icdCodeDescription": "Unspecified diabetes mellitus with unspecified neuropathy"
//             },
//             {
//               "icdCode": "E13.72",
//               "icdCodeDescription": "Other specified diabetes mellitus with features of insulin resistance"
//             },
//             {
//               "icdCode": "E13.73",
//               "icdCodeDescription": "Other specified diabetes mellitus with foot ulcer due to multiple causes"
//             },
//             {
//               "icdCode": "E14.42",
//               "icdCodeDescription": "Unspecified diabetes mellitus with diabetic polyneuropathy"
//             },
//             {
//               "icdCode": "E14.41",
//               "icdCodeDescription": "Unspecified diabetes mellitus with diabetic mononeuropathy"
//             },
//             {
//               "icdCode": "E14.43",
//               "icdCodeDescription": "Unspecified diabetes mellitus with diabetic autonomic neuropathy"
//             },
//             {
//               "icdCode": "I69.4",
//               "icdCodeDescription": "Sequelae of stroke, not specified as haemorrhage or infarction"
//             },
//             {
//               "icdCode": "N17.1",
//               "icdCodeDescription": "Acute renal failure with acute cortical necrosis"
//             },
//             {
//               "icdCode": "N17.2",
//               "icdCodeDescription": "Acute renal failure with medullary necrosis"
//             },
//             {
//               "icdCode": "E13.80",
//               "icdCodeDescription": "Other specified diabetes mellitus with unspecified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.81",
//               "icdCodeDescription": "Other specified diabetes mellitus with unspecified complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "N17.0",
//               "icdCodeDescription": "Acute renal failure with tubular necrosis"
//             },
//             {
//               "icdCode": "N17.9",
//               "icdCodeDescription": "Acute renal failure, unspecified"
//             },
//             {
//               "icdCode": "N17.8",
//               "icdCodeDescription": "Other acute renal failure"
//             },
//             {
//               "icdCode": "E14.59",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified circulatory complication"
//             },
//             {
//               "icdCode": "H36.0",
//               "icdCodeDescription": "Diabetic retinopathy"
//             },
//             {
//               "icdCode": "E14.51",
//               "icdCodeDescription": "Unspecified diabetes mellitus with peripheral angiopathy without gangrene"
//             },
//             {
//               "icdCode": "E14.50",
//               "icdCodeDescription": "Unspecified diabetes mellitus with circulatory complication, unspecified"
//             },
//             {
//               "icdCode": "E14.53",
//               "icdCodeDescription": "Unspecified diabetes mellitus with diabetic ischaemic cardiomyopathy"
//             },
//             {
//               "icdCode": "E14.52",
//               "icdCodeDescription": "Unspecified diabetes mellitus with peripheral angiopathy with gangrene"
//             },
//             {
//               "icdCode": "E13.90",
//               "icdCodeDescription": "Other specified diabetes mellitus without complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "E13.91",
//               "icdCodeDescription": "Other specified diabetes mellitus without complications, stated as uncontrolled"
//             },
//             {
//               "icdCode": "E14.60",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "N06.6",
//               "icdCodeDescription": "Isolated proteinuria with dense deposit disease"
//             },
//             {
//               "icdCode": "E10.20",
//               "icdCodeDescription": "Type 1 diabetes mellitus with renal complication, unspecified"
//             },
//             {
//               "icdCode": "E14.69",
//               "icdCodeDescription": "Unspecified diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "R07.4",
//               "icdCodeDescription": "Chest pain, unspecified"
//             },
//             {
//               "icdCode": "E10.1",
//               "icdCodeDescription": "Type 1 diabetes mellitus with acidosis"
//             },
//             {
//               "icdCode": "R07.3",
//               "icdCodeDescription": "Other chest pain"
//             },
//             {
//               "icdCode": "E14.62",
//               "icdCodeDescription": "Unspecified diabetes mellitus with specified skin and subcutaneous tissue complication"
//             },
//             {
//               "icdCode": "E10.6",
//               "icdCodeDescription": "Type 1 diabetes mellitus with other specified complication"
//             },
//             {
//               "icdCode": "E14.61",
//               "icdCodeDescription": "Unspecified diabetes mellitus with specified diabetic musculoskeletal and connective tissue complication"
//             },
//             {
//               "icdCode": "E14.64",
//               "icdCodeDescription": "Unspecified diabetes mellitus with hypoglycaemia"
//             },
//             {
//               "icdCode": "E10.4",
//               "icdCodeDescription": "Type 1 diabetes mellitus with neurological complication"
//             },
//             {
//               "icdCode": "E14.63",
//               "icdCodeDescription": "Unspecified diabetes mellitus with specified periodontal complication"
//             },
//             {
//               "icdCode": "E14.65",
//               "icdCodeDescription": "Unspecified diabetes mellitus with poor control"
//             },
//             {
//               "icdCode": "E10.9",
//               "icdCodeDescription": "Insulin-dependent diabetes mellitus without complications"
//             },
//             {
//               "icdCode": "K76.9",
//               "icdCodeDescription": "Liver disease, unspecified"
//             },
//             {
//               "icdCode": "E10.8",
//               "icdCodeDescription": "Type 1 diabetes mellitus with unspecified complication"
//             },
//             {
//               "icdCode": "E10.7",
//               "icdCodeDescription": "Type 1 diabetes mellitus with multiple complications"
//             },
//             {
//               "icdCode": "K76.0",
//               "icdCodeDescription": "Fatty (change of) liver, not elsewhere classified"
//             },
//             {
//               "icdCode": "N18.0",
//               "icdCodeDescription": "End-stage renal disease"
//             },
//             {
//               "icdCode": "E14.71",
//               "icdCodeDescription": "Unspecified diabetes mellitus with multiple microvascular complications"
//             },
//             {
//               "icdCode": "E14.70",
//               "icdCodeDescription": "Unspecified diabetes mellitus with multiple complications, not stated as uncontrolled"
//             },
//             {
//               "icdCode": "N18.8",
//               "icdCodeDescription": "Other chronic renal failure"
//             },
//             {
//               "icdCode": "N18.9",
//               "icdCodeDescription": "Chronic renal failure, unspecified"
//             }
//           ]
//         }
//       },
//       {
//         "serviceCode": "9-114-08",
//         "serviceDescription": "Omacor 1000 mg Capsule 28pcs",
//         "requestedQuantity": "3",
//         "amount": "103.9",
//         "daysOfSupply": "90",
//         "status": "REJECTED",
//         "errors": [
//           {
//             "description": "Drug Not Found For Code : 9-114-08",
//             "code": "CPDRGNF0019"
//           }
//         ],
//         "request_detail_no": 27015452,
//         "suggestion": {
//           "serviceCode": "9-114-08",
//           "errorDescription": "Drug Not Found For Code : 9-114-08",
//           "suggestedIcds": []
//         }
//       }
//     ]
//   },
//   "sugeestionError": null,
//   "suggestionResult": [
//     {
//       "serviceCode": "9-114-08",
//       "errorDescription": "Drug Not Found For Code : 9-114-08",
//       "suggestedIcds": []
//     },
//     {
//       "serviceCode": "0203233315",
//       "scientificCode": "14000001650-30-100000073664",
//       "suggestedIcds": [
//         {
//           "icdCode": "E75",
//           "icdCodeDescription": "Disorders of sphingolipid metabolism and other lipid storage disorders"
//         },
//         {
//           "icdCode": "E78",
//           "icdCodeDescription": "Disorders of lipoprotein metabolism and other lipidaemias"
//         },
//         {
//           "icdCode": "E13.29",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified renal complication"
//         },
//         {
//           "icdCode": "E11.81",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with unspecified complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.80",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with unspecified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.20",
//           "icdCodeDescription": "Other specified diabetes mellitus with renal complication, unspecified"
//         },
//         {
//           "icdCode": "E13.21",
//           "icdCodeDescription": "Other specified diabetes mellitus with incipient diabetic nephropathy"
//         },
//         {
//           "icdCode": "E13.22",
//           "icdCodeDescription": "Other specified diabetes mellitus with established diabetic nephropathy"
//         },
//         {
//           "icdCode": "E13.23",
//           "icdCodeDescription": "Other specified diabetes mellitus with advanced renal disease"
//         },
//         {
//           "icdCode": "I71.8",
//           "icdCodeDescription": "Aortic aneurysm of unspecified site, ruptured"
//         },
//         {
//           "icdCode": "I71.9",
//           "icdCodeDescription": "Aortic aneurysm of unspecified site, without mention of rupture"
//         },
//         {
//           "icdCode": "I71.6",
//           "icdCodeDescription": "Thoracoabdominal aortic aneurysm, without mention of rupture"
//         },
//         {
//           "icdCode": "I71.4",
//           "icdCodeDescription": "Abdominal aortic aneurysm, without mention of rupture"
//         },
//         {
//           "icdCode": "I71.5",
//           "icdCodeDescription": "Thoracoabdominal aortic aneurysm, ruptured"
//         },
//         {
//           "icdCode": "E11.90",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus without complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "I71.2",
//           "icdCodeDescription": "Thoracic aortic aneurysm, without mention of rupture"
//         },
//         {
//           "icdCode": "I71.3",
//           "icdCodeDescription": "Abdominal aortic aneurysm, ruptured"
//         },
//         {
//           "icdCode": "I71.0",
//           "icdCodeDescription": "Dissection of aorta"
//         },
//         {
//           "icdCode": "I71.1",
//           "icdCodeDescription": "Thoracic aortic aneurysm, ruptured"
//         },
//         {
//           "icdCode": "E13.35",
//           "icdCodeDescription": "Other specified diabetes mellitus with advanced ophthalmic disease"
//         },
//         {
//           "icdCode": "E13.36",
//           "icdCodeDescription": "Other specified diabetes mellitus with diabetic cataract"
//         },
//         {
//           "icdCode": "E11.1",
//           "icdCodeDescription": "Type 2 diabetes mellitus with acidosis"
//         },
//         {
//           "icdCode": "E13.39",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified ophthalmic complication"
//         },
//         {
//           "icdCode": "E11.0",
//           "icdCodeDescription": "Type 2 diabetes mellitus with hyperosmolarity"
//         },
//         {
//           "icdCode": "E11.91",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus without complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.5",
//           "icdCodeDescription": "Type 2 diabetes mellitus with circulatory complciation"
//         },
//         {
//           "icdCode": "E11.4",
//           "icdCodeDescription": "Type 2 diabetes mellitus with neurological complication"
//         },
//         {
//           "icdCode": "E11.3",
//           "icdCodeDescription": "Type 2 diabetes mellitus with ophthalmic complication"
//         },
//         {
//           "icdCode": "E11.2",
//           "icdCodeDescription": "Type 2 diabetes mellitus with renal complication"
//         },
//         {
//           "icdCode": "E13.30",
//           "icdCodeDescription": "Other specified diabetes mellitus with ophthalmic complication, unspecified"
//         },
//         {
//           "icdCode": "E11.9",
//           "icdCodeDescription": "Type 2 diabetes mellitus without complication"
//         },
//         {
//           "icdCode": "E13.31",
//           "icdCodeDescription": "Other specified diabetes mellitus with background retinopathy"
//         },
//         {
//           "icdCode": "E14.00",
//           "icdCodeDescription": "Unspecified diabetes mellitus with coma, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.8",
//           "icdCodeDescription": "Type 2 diabetes mellitus with unspecified complication"
//         },
//         {
//           "icdCode": "E13.32",
//           "icdCodeDescription": "Other specified diabetes mellitus with preproliferative retinopathy"
//         },
//         {
//           "icdCode": "E11.7",
//           "icdCodeDescription": "Type 2 diabetes mellitus with multiple complications"
//         },
//         {
//           "icdCode": "E13.33",
//           "icdCodeDescription": "Other specified diabetes mellitus with proliferative retinopathy"
//         },
//         {
//           "icdCode": "E14.02",
//           "icdCodeDescription": "Unspecified diabetes mellitus with hyperosmolarity, with coma"
//         },
//         {
//           "icdCode": "I21.9",
//           "icdCodeDescription": "Acute myocardial infarction, unspecified"
//         },
//         {
//           "icdCode": "E11.6",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "E13.34",
//           "icdCodeDescription": "Other specified diabetes mellitus with other retinopathy"
//         },
//         {
//           "icdCode": "E14.01",
//           "icdCodeDescription": "Unspecified diabetes mellitus with hyperosmolarity, without nonketotic hyperglycaemic-hyperosmolar coma [NKHHC]"
//         },
//         {
//           "icdCode": "I21.3",
//           "icdCodeDescription": "Acute transmural myocardial infarction of unspecified site"
//         },
//         {
//           "icdCode": "I21.4",
//           "icdCodeDescription": "Acute subendocardial myocardial infarction"
//         },
//         {
//           "icdCode": "I82.8",
//           "icdCodeDescription": "Embolism and thrombosis of other specified veins"
//         },
//         {
//           "icdCode": "I82.9",
//           "icdCodeDescription": "Embolism and thrombosis of unspecified vein"
//         },
//         {
//           "icdCode": "I67.2",
//           "icdCodeDescription": "Cerebral atherosclerosis"
//         },
//         {
//           "icdCode": "I21.0",
//           "icdCodeDescription": "Acute transmural myocardial infarction of anterior wall"
//         },
//         {
//           "icdCode": "I21.1",
//           "icdCodeDescription": "Acute transmural myocardial infarction of inferior wall"
//         },
//         {
//           "icdCode": "I21.2",
//           "icdCodeDescription": "Acute transmural myocardial infarction of other sites"
//         },
//         {
//           "icdCode": "I82.2",
//           "icdCodeDescription": "Embolism and thrombosis of vena cava"
//         },
//         {
//           "icdCode": "I82.3",
//           "icdCodeDescription": "Embolism and thrombosis of renal vein"
//         },
//         {
//           "icdCode": "I82.1",
//           "icdCodeDescription": "Thrombophlebitis migrans"
//         },
//         {
//           "icdCode": "E14.15",
//           "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, with lactic acidosis, without coma"
//         },
//         {
//           "icdCode": "E14.14",
//           "icdCodeDescription": "Unspecified diabetes mellitus with lactic acidosis, with coma"
//         },
//         {
//           "icdCode": "E13.49",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified neurological complication"
//         },
//         {
//           "icdCode": "E14.16",
//           "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, with lactic acidosis, with coma"
//         },
//         {
//           "icdCode": "I25.13",
//           "icdCodeDescription": "Atherosclerotic heart disease, of nonautologous bypass graft"
//         },
//         {
//           "icdCode": "I25.12",
//           "icdCodeDescription": "Atherosclerotic heart disease, of autologous bypass graft"
//         },
//         {
//           "icdCode": "E13.40",
//           "icdCodeDescription": "Other specified diabetes mellitus with unspecified neuropathy"
//         },
//         {
//           "icdCode": "I25.11",
//           "icdCodeDescription": "Atherosclerotic heart disease, of native coronary artery"
//         },
//         {
//           "icdCode": "E13.41",
//           "icdCodeDescription": "Other specified diabetes mellitus with diabetic mononeuropathy"
//         },
//         {
//           "icdCode": "I25.10",
//           "icdCodeDescription": "Atherosclerotic heart disease, of unspecified vessel"
//         },
//         {
//           "icdCode": "E13.42",
//           "icdCodeDescription": "Other specified diabetes mellitus with diabetic polyneuropathy"
//         },
//         {
//           "icdCode": "E14.11",
//           "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, without coma"
//         },
//         {
//           "icdCode": "E13.43",
//           "icdCodeDescription": "Other specified diabetes mellitus with diabetic autonomic neuropathy"
//         },
//         {
//           "icdCode": "E14.10",
//           "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "I78.8",
//           "icdCodeDescription": "Other diseases of capillaries"
//         },
//         {
//           "icdCode": "E14.13",
//           "icdCodeDescription": "Unspecified diabetes mellitus with lactic acidosis, without coma"
//         },
//         {
//           "icdCode": "E14.12",
//           "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, with coma"
//         },
//         {
//           "icdCode": "I70.9",
//           "icdCodeDescription": "Generalised and unspecified atherosclerosis"
//         },
//         {
//           "icdCode": "I78.0",
//           "icdCodeDescription": "Hereditary haemorrhagic telangiectasia"
//         },
//         {
//           "icdCode": "Z95.1",
//           "icdCodeDescription": "Presence of aortocoronary bypass graft"
//         },
//         {
//           "icdCode": "Z95.0",
//           "icdCodeDescription": "Presence of cardiac device"
//         },
//         {
//           "icdCode": "I70.1",
//           "icdCodeDescription": "Atherosclerosis of renal artery"
//         },
//         {
//           "icdCode": "I70.2",
//           "icdCodeDescription": "Atherosclerosis of arteries of extremities"
//         },
//         {
//           "icdCode": "I70.0",
//           "icdCodeDescription": "Atherosclerosis of aorta"
//         },
//         {
//           "icdCode": "E13.59",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified circulatory complication"
//         },
//         {
//           "icdCode": "E14.29",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified renal complication"
//         },
//         {
//           "icdCode": "I21",
//           "icdCodeDescription": "Acute myocardial infarction"
//         },
//         {
//           "icdCode": "I20",
//           "icdCodeDescription": "Angina pectoris"
//         },
//         {
//           "icdCode": "I23",
//           "icdCodeDescription": "Certain current complications following acute myocardial infarction"
//         },
//         {
//           "icdCode": "E13.50",
//           "icdCodeDescription": "Other specified diabetes mellitus with circulatory complication, unspecified"
//         },
//         {
//           "icdCode": "I22",
//           "icdCodeDescription": "Subsequent myocardial infarction"
//         },
//         {
//           "icdCode": "E13.51",
//           "icdCodeDescription": "Other specified diabetes mellitus with peripheral angiopathy without gangrene"
//         },
//         {
//           "icdCode": "E14.20",
//           "icdCodeDescription": "Unspecified diabetes mellitus with renal complication, unspecified"
//         },
//         {
//           "icdCode": "I25",
//           "icdCodeDescription": "Chronic ischaemic heart disease"
//         },
//         {
//           "icdCode": "E13.52",
//           "icdCodeDescription": "Other specified diabetes mellitus with peripheral angiopathy with gangrene"
//         },
//         {
//           "icdCode": "I24",
//           "icdCodeDescription": "Other acute ischaemic heart diseases"
//         },
//         {
//           "icdCode": "E13.53",
//           "icdCodeDescription": "Other specified diabetes mellitus with diabetic ischaemic cardiomyopathy"
//         },
//         {
//           "icdCode": "E14.22",
//           "icdCodeDescription": "Unspecified diabetes mellitus with established diabetic nephropathy"
//         },
//         {
//           "icdCode": "I20.8",
//           "icdCodeDescription": "Other forms of angina pectoris"
//         },
//         {
//           "icdCode": "E14.21",
//           "icdCodeDescription": "Unspecified diabetes mellitus with incipient diabetic nephropathy"
//         },
//         {
//           "icdCode": "I20.9",
//           "icdCodeDescription": "Angina pectoris, unspecified"
//         },
//         {
//           "icdCode": "E14.23",
//           "icdCodeDescription": "Unspecified diabetes mellitus with advanced renal disease"
//         },
//         {
//           "icdCode": "I20.0",
//           "icdCodeDescription": "Unstable angina"
//         },
//         {
//           "icdCode": "I20.1",
//           "icdCodeDescription": "Angina pectoris with documented spasm"
//         },
//         {
//           "icdCode": "I73.00",
//           "icdCodeDescription": "Raynaud's syndrome without gangrene"
//         },
//         {
//           "icdCode": "I73.01",
//           "icdCodeDescription": "Raynaud's syndrome with gangrene"
//         },
//         {
//           "icdCode": "E11.43",
//           "icdCodeDescription": "Type 2 diabetes mellitus with diabetic autonomic neuropathy"
//         },
//         {
//           "icdCode": "E11.42",
//           "icdCodeDescription": "Type 2 diabetes mellitus with diabetic polyneuropathy"
//         },
//         {
//           "icdCode": "E10.73",
//           "icdCodeDescription": "Type 1 diabetes mellitus with foot ulcer due to multiple causes"
//         },
//         {
//           "icdCode": "E11.41",
//           "icdCodeDescription": "Type 2 diabetes mellitus with diabetic mononeuropathy"
//         },
//         {
//           "icdCode": "E11.40",
//           "icdCodeDescription": "Type 2 diabetes mellitus with unspecified neuropathy"
//         },
//         {
//           "icdCode": "E10.71",
//           "icdCodeDescription": "Type 1 diabetes mellitus with multiple microvascular complications"
//         },
//         {
//           "icdCode": "E10.70",
//           "icdCodeDescription": "Insulin-dependent diabetes mellitus with multiple complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.49",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other specified neurological complication"
//         },
//         {
//           "icdCode": "E11.53",
//           "icdCodeDescription": "Type 2 diabetes mellitus with diabetic ischaemic cardiomyopathy"
//         },
//         {
//           "icdCode": "E11.52",
//           "icdCodeDescription": "Type 2 diabetes mellitus with peripheral angiopathy with gangrene"
//         },
//         {
//           "icdCode": "I71.03",
//           "icdCodeDescription": "Dissection of thoracoabdominal aorta"
//         },
//         {
//           "icdCode": "E11.51",
//           "icdCodeDescription": "Type 2 diabetes mellitus with peripheral angiopathy without gangrene"
//         },
//         {
//           "icdCode": "I71.02",
//           "icdCodeDescription": "Dissection of abdominal aorta"
//         },
//         {
//           "icdCode": "E11.50",
//           "icdCodeDescription": "Type 2 diabetes mellitus with circulatory complication, unspecified"
//         },
//         {
//           "icdCode": "I71.01",
//           "icdCodeDescription": "Dissection of thoracic aorta"
//         },
//         {
//           "icdCode": "E10.81",
//           "icdCodeDescription": "Insulin-dependent diabetes mellitus with unspecified complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "I71.00",
//           "icdCodeDescription": "Dissection of aorta, unspecified site"
//         },
//         {
//           "icdCode": "E10.80",
//           "icdCodeDescription": "Insulin-dependent diabetes mellitus with unspecified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.3",
//           "icdCodeDescription": "Other specified diabetes mellitus with ophthalmic complication"
//         },
//         {
//           "icdCode": "E13.2",
//           "icdCodeDescription": "Other specified diabetes mellitus with renal complication"
//         },
//         {
//           "icdCode": "E13.1",
//           "icdCodeDescription": "Other specified diabetes mellitus with acidosis"
//         },
//         {
//           "icdCode": "E11.59",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other specified circulatory complication"
//         },
//         {
//           "icdCode": "E13.0",
//           "icdCodeDescription": "Other specified diabetes mellitus with hyperosmolarity"
//         },
//         {
//           "icdCode": "E13.7",
//           "icdCodeDescription": "Other specified diabetes mellitus with multiple complications"
//         },
//         {
//           "icdCode": "E13.6",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "G46.3",
//           "icdCodeDescription": "Brain stem stroke syndrome (I60-I67+)"
//         },
//         {
//           "icdCode": "E13.5",
//           "icdCodeDescription": "Other specified diabetes mellitus with circulatory complication"
//         },
//         {
//           "icdCode": "G46.4",
//           "icdCodeDescription": "Cerebellar stroke syndrome (I60-I67+)"
//         },
//         {
//           "icdCode": "E13.4",
//           "icdCodeDescription": "Other specified diabetes mellitus with neurological complication"
//         },
//         {
//           "icdCode": "E13.9",
//           "icdCodeDescription": "Other specified diabetes mellitus without complication"
//         },
//         {
//           "icdCode": "E13.8",
//           "icdCodeDescription": "Other specified diabetes mellitus with unspecified complication"
//         },
//         {
//           "icdCode": "E11.65",
//           "icdCodeDescription": "Type 2 diabetes mellitus with poor control"
//         },
//         {
//           "icdCode": "E13.02",
//           "icdCodeDescription": "Other specified diabetes mellitus with hyperosmolarity, with coma"
//         },
//         {
//           "icdCode": "E11.64",
//           "icdCodeDescription": "Type 2 diabetes mellitus with hypoglycaemia"
//         },
//         {
//           "icdCode": "E11.63",
//           "icdCodeDescription": "Type 2 diabetes mellitus with specified periodontal complication"
//         },
//         {
//           "icdCode": "I50",
//           "icdCodeDescription": "Heart failure"
//         },
//         {
//           "icdCode": "E11.62",
//           "icdCodeDescription": "Type 2 diabetes mellitus with specified skin and subcutaneous tissue complication"
//         },
//         {
//           "icdCode": "E11.61",
//           "icdCodeDescription": "Type 2 diabetes mellitus with specified diabetic musculoskeletal and connective tissue complication"
//         },
//         {
//           "icdCode": "I52",
//           "icdCodeDescription": "Other heart disorders in diseases classified elsewhere"
//         },
//         {
//           "icdCode": "E11.60",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with other specified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E10.91",
//           "icdCodeDescription": "Insulin-dependent diabetes mellitus without complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E10.90",
//           "icdCodeDescription": "Insulin-dependent diabetes mellitus without complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.69",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "E13.00",
//           "icdCodeDescription": "Other specified diabetes mellitus with coma, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.01",
//           "icdCodeDescription": "Other specified diabetes mellitus with hyperosmolarity, without nonketotic hyperglycaemic-hyperosmolar coma [NKHHC]"
//         },
//         {
//           "icdCode": "E13.13",
//           "icdCodeDescription": "Other specified diabetes mellitus with lactic acidosis, without coma"
//         },
//         {
//           "icdCode": "E13.14",
//           "icdCodeDescription": "Other specified diabetes mellitus with lactic acidosis, with coma"
//         },
//         {
//           "icdCode": "E75.3",
//           "icdCodeDescription": "Sphingolipidosis, unspecified"
//         },
//         {
//           "icdCode": "E13.15",
//           "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, with lactic acidosis, without coma"
//         },
//         {
//           "icdCode": "E75.0",
//           "icdCodeDescription": "GM2 gangliosidosis"
//         },
//         {
//           "icdCode": "E11.73",
//           "icdCodeDescription": "Type 2 diabetes mellitus with foot ulcer due to multiple causes"
//         },
//         {
//           "icdCode": "E13.16",
//           "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, with lactic acidosis, with coma"
//         },
//         {
//           "icdCode": "E75.1",
//           "icdCodeDescription": "Other gangliosidosis"
//         },
//         {
//           "icdCode": "E11.72",
//           "icdCodeDescription": "Type 2 diabetes mellitus with features of insulin resistance"
//         },
//         {
//           "icdCode": "I63",
//           "icdCodeDescription": "Cerebral infarction"
//         },
//         {
//           "icdCode": "E11.71",
//           "icdCodeDescription": "Type 2 diabetes mellitus with multiple microvascular complications"
//         },
//         {
//           "icdCode": "E11.70",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with multiple complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "I64",
//           "icdCodeDescription": "Stroke, not specified as haemorrhage or infarction"
//         },
//         {
//           "icdCode": "E14.2",
//           "icdCodeDescription": "Unspecified diabetes mellitus with renal complication"
//         },
//         {
//           "icdCode": "E14.1",
//           "icdCodeDescription": "Unspecified diabetes mellitus with acidosis"
//         },
//         {
//           "icdCode": "E14.0",
//           "icdCodeDescription": "Unspecified diabetes mellitus with hyperosmolarity"
//         },
//         {
//           "icdCode": "E14.6",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "E75.6",
//           "icdCodeDescription": "Lipid storage disorder, unspecified"
//         },
//         {
//           "icdCode": "I49.2",
//           "icdCodeDescription": "Junctional premature depolarisation"
//         },
//         {
//           "icdCode": "E13.10",
//           "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E14.5",
//           "icdCodeDescription": "Unspecified diabetes mellitus with circulatory complication"
//         },
//         {
//           "icdCode": "E13.11",
//           "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, without coma"
//         },
//         {
//           "icdCode": "E14.4",
//           "icdCodeDescription": "Unspecified diabetes mellitus with neurological complication"
//         },
//         {
//           "icdCode": "E75.4",
//           "icdCodeDescription": "Neuronal ceroid lipofuscinosis"
//         },
//         {
//           "icdCode": "E13.12",
//           "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, with coma"
//         },
//         {
//           "icdCode": "E14.3",
//           "icdCodeDescription": "Unspecified diabetes mellitus with ophthalmic complication"
//         },
//         {
//           "icdCode": "E75.5",
//           "icdCodeDescription": "Other lipid storage disorders"
//         },
//         {
//           "icdCode": "I49.3",
//           "icdCodeDescription": "Ventricular premature depolarisation"
//         },
//         {
//           "icdCode": "E14.9",
//           "icdCodeDescription": "Unspecified diabetes mellitus without complication"
//         },
//         {
//           "icdCode": "E14.8",
//           "icdCodeDescription": "Unspecified diabetes mellitus with unspecified complication"
//         },
//         {
//           "icdCode": "E14.7",
//           "icdCodeDescription": "Unspecified diabetes mellitus with multiple complications"
//         },
//         {
//           "icdCode": "U82.1",
//           "icdCodeDescription": "Ischaemic heart disease"
//         },
//         {
//           "icdCode": "E10.31",
//           "icdCodeDescription": "Type 1 diabetes mellitus with background retinopathy"
//         },
//         {
//           "icdCode": "I70",
//           "icdCodeDescription": "Atherosclerosis"
//         },
//         {
//           "icdCode": "E10.30",
//           "icdCodeDescription": "Type 1 diabetes mellitus with ophthalmic complication, unspecified"
//         },
//         {
//           "icdCode": "I72",
//           "icdCodeDescription": "Other aneurysm"
//         },
//         {
//           "icdCode": "I71",
//           "icdCodeDescription": "Aortic aneurysm and dissection"
//         },
//         {
//           "icdCode": "I74",
//           "icdCodeDescription": "Arterial embolism and thrombosis"
//         },
//         {
//           "icdCode": "I73",
//           "icdCodeDescription": "Other peripheral vascular diseases"
//         },
//         {
//           "icdCode": "E10.39",
//           "icdCodeDescription": "Type 1 diabetes mellitus with other specified ophthalmic complication"
//         },
//         {
//           "icdCode": "E14.73",
//           "icdCodeDescription": "Unspecified diabetes mellitus with foot ulcer due to multiple causes"
//         },
//         {
//           "icdCode": "E14.72",
//           "icdCodeDescription": "Unspecified diabetes mellitus with features of insulin resistance"
//         },
//         {
//           "icdCode": "E10.36",
//           "icdCodeDescription": "Type 1 diabetes mellitus with diabetic cataract"
//         },
//         {
//           "icdCode": "E10.35",
//           "icdCodeDescription": "Type 1 diabetes mellitus with advanced ophthalmic disease"
//         },
//         {
//           "icdCode": "E10.34",
//           "icdCodeDescription": "Type 1 diabetes mellitus with other retinopathy"
//         },
//         {
//           "icdCode": "E11.02",
//           "icdCodeDescription": "Type 2 diabetes mellitus with hyperosmolarity with coma"
//         },
//         {
//           "icdCode": "E10.33",
//           "icdCodeDescription": "Type 1 diabetes mellitus with proliferative retinopathy"
//         },
//         {
//           "icdCode": "E11.01",
//           "icdCodeDescription": "Type 2 diabetes mellitus with hyperosmolarity without nonketotic hyperglycaemic-hyperosmolar coma [NKHHC]"
//         },
//         {
//           "icdCode": "E10.32",
//           "icdCodeDescription": "Type 1 diabetes mellitus with preproliferative retinopathy"
//         },
//         {
//           "icdCode": "E11.00",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with coma, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E14.80",
//           "icdCodeDescription": "Unspecified diabetes mellitus with unspecified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "Z95",
//           "icdCodeDescription": "Presence of cardiac and vascular implants and grafts"
//         },
//         {
//           "icdCode": "I52.1",
//           "icdCodeDescription": "Other heart disorders in other infectious and parasitic diseases classified elsewhere"
//         },
//         {
//           "icdCode": "E14.81",
//           "icdCodeDescription": "Unspecified diabetes mellitus with unspecified complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "I52.0",
//           "icdCodeDescription": "Other heart disorders in bacterial diseases classified elsewhere"
//         },
//         {
//           "icdCode": "E10.42",
//           "icdCodeDescription": "Type 1 diabetes mellitus with diabetic polyneuropathy"
//         },
//         {
//           "icdCode": "E11.10",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with ketoacidosis, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E10.41",
//           "icdCodeDescription": "Type 1 diabetes mellitus with diabetic mononeuropathy"
//         },
//         {
//           "icdCode": "E10.40",
//           "icdCodeDescription": "Type 1 diabetes mellitus with unspecified neuropathy"
//         },
//         {
//           "icdCode": "E10.49",
//           "icdCodeDescription": "Type 1 diabetes mellitus with other specified neurological complication"
//         },
//         {
//           "icdCode": "I25.8",
//           "icdCodeDescription": "Other forms of chronic ischaemic heart disease"
//         },
//         {
//           "icdCode": "E11.16",
//           "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, with lactic acidosis, with coma"
//         },
//         {
//           "icdCode": "I25.9",
//           "icdCodeDescription": "Chronic ischaemic heart disease, unspecified"
//         },
//         {
//           "icdCode": "E11.15",
//           "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, with lactic acidosis, without coma"
//         },
//         {
//           "icdCode": "E11.14",
//           "icdCodeDescription": "Type 2 diabetes mellitus with lactic acidosis, with coma"
//         },
//         {
//           "icdCode": "I25.3",
//           "icdCodeDescription": "Aneurysm of heart"
//         },
//         {
//           "icdCode": "E11.13",
//           "icdCodeDescription": "Type 2 diabetes mellitus with lactic acidosis, without coma"
//         },
//         {
//           "icdCode": "I25.4",
//           "icdCodeDescription": "Coronary artery aneurysm"
//         },
//         {
//           "icdCode": "E11.12",
//           "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, with coma"
//         },
//         {
//           "icdCode": "I25.5",
//           "icdCodeDescription": "Ischaemic cardiomyopathy"
//         },
//         {
//           "icdCode": "I63.9",
//           "icdCodeDescription": "Cerebral infarction, unspecified"
//         },
//         {
//           "icdCode": "E10.43",
//           "icdCodeDescription": "Type 1 diabetes mellitus with diabetic autonomic neuropathy"
//         },
//         {
//           "icdCode": "E11.11",
//           "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, without coma"
//         },
//         {
//           "icdCode": "I25.6",
//           "icdCodeDescription": "Silent myocardial ischaemia"
//         },
//         {
//           "icdCode": "I25.0",
//           "icdCodeDescription": "Atherosclerotic cardiovascular disease, so described"
//         },
//         {
//           "icdCode": "I63.8",
//           "icdCodeDescription": "Other cerebral infarction"
//         },
//         {
//           "icdCode": "I25.1",
//           "icdCodeDescription": "Atherosclerotic heart disease"
//         },
//         {
//           "icdCode": "I63.5",
//           "icdCodeDescription": "Cerebral infarction due to unspecified occlusion or stenosis of cerebral arteries"
//         },
//         {
//           "icdCode": "I25.2",
//           "icdCodeDescription": "Old myocardial infarction"
//         },
//         {
//           "icdCode": "I63.6",
//           "icdCodeDescription": "Cerebral infarction due to cerebral venous thrombosis, nonpyogenic"
//         },
//         {
//           "icdCode": "E14.91",
//           "icdCodeDescription": "Unspecified diabetes mellitus without complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "I63.3",
//           "icdCodeDescription": "Cerebral infarction due to thrombosis of cerebral arteries"
//         },
//         {
//           "icdCode": "E14.90",
//           "icdCodeDescription": "Unspecified diabetes mellitus without complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "I63.4",
//           "icdCodeDescription": "Cerebral infarction due to embolism of cerebral arteries"
//         },
//         {
//           "icdCode": "I63.1",
//           "icdCodeDescription": "Cerebral infarction due to embolism of precerebral arteries"
//         },
//         {
//           "icdCode": "I63.2",
//           "icdCodeDescription": "Cerebral infarction due to unspecified occlusion or stenosis of precerebral arteries"
//         },
//         {
//           "icdCode": "I63.0",
//           "icdCodeDescription": "Cerebral infarction due to thrombosis of precerebral arteries"
//         },
//         {
//           "icdCode": "E10.53",
//           "icdCodeDescription": "Type 1 diabetes mellitus with diabetic ischaemic cardiomyopathy"
//         },
//         {
//           "icdCode": "E11.21",
//           "icdCodeDescription": "Type 2 diabetes mellitus with incipient diabetic nephropathy"
//         },
//         {
//           "icdCode": "E10.52",
//           "icdCodeDescription": "Type 1 diabetes mellitus with peripheral angiopathy, with gangrene"
//         },
//         {
//           "icdCode": "E11.20",
//           "icdCodeDescription": "Type 2 diabetes mellitus with renal complication, unspecified"
//         },
//         {
//           "icdCode": "E10.51",
//           "icdCodeDescription": "Type 1 diabetes mellitus with peripheral angiopathy, without gangrene"
//         },
//         {
//           "icdCode": "E10",
//           "icdCodeDescription": "Type 1 diabetes mellitus"
//         },
//         {
//           "icdCode": "E10.50",
//           "icdCodeDescription": "Type 1 diabetes mellitus with circulatory complication, unspecified"
//         },
//         {
//           "icdCode": "E11",
//           "icdCodeDescription": "Type 2 diabetes mellitus"
//         },
//         {
//           "icdCode": "I70.21",
//           "icdCodeDescription": "Atherosclerosis of arteries of extremities with intermittent claudication"
//         },
//         {
//           "icdCode": "E14",
//           "icdCodeDescription": "Unspecified diabetes mellitus"
//         },
//         {
//           "icdCode": "I70.20",
//           "icdCodeDescription": "Atherosclerosis of arteries of extremities, unspecified"
//         },
//         {
//           "icdCode": "E13",
//           "icdCodeDescription": "Other specified diabetes mellitus"
//         },
//         {
//           "icdCode": "E11.29",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other specified renal complication"
//         },
//         {
//           "icdCode": "E10.59",
//           "icdCodeDescription": "Type 1 diabetes mellitus with other specified circulatory complication"
//         },
//         {
//           "icdCode": "E11.23",
//           "icdCodeDescription": "Type 2 diabetes mellitus with advanced renal disease"
//         },
//         {
//           "icdCode": "E11.22",
//           "icdCodeDescription": "Type 2 diabetes mellitus with established diabetic nephropathy"
//         },
//         {
//           "icdCode": "I51.7",
//           "icdCodeDescription": "Cardiomegaly"
//         },
//         {
//           "icdCode": "I51.6",
//           "icdCodeDescription": "Cardiovascular disease, unspecified"
//         },
//         {
//           "icdCode": "I51.9",
//           "icdCodeDescription": "Heart disease, unspecified"
//         },
//         {
//           "icdCode": "I51.8",
//           "icdCodeDescription": "Other ill-defined heart diseases"
//         },
//         {
//           "icdCode": "I74.3",
//           "icdCodeDescription": "Embolism and thrombosis of arteries of lower extremities"
//         },
//         {
//           "icdCode": "I74.1",
//           "icdCodeDescription": "Embolism and thrombosis of other and unspecified parts of aorta"
//         },
//         {
//           "icdCode": "I51.5",
//           "icdCodeDescription": "Myocardial degeneration"
//         },
//         {
//           "icdCode": "I74.2",
//           "icdCodeDescription": "Embolism and thrombosis of arteries of upper extremities"
//         },
//         {
//           "icdCode": "I74.0",
//           "icdCodeDescription": "Embolism and thrombosis of abdominal aorta"
//         },
//         {
//           "icdCode": "E10.64",
//           "icdCodeDescription": "Type 1 diabetes mellitus with hypoglycaemia"
//         },
//         {
//           "icdCode": "E11.32",
//           "icdCodeDescription": "Type 2 diabetes mellitus with preproliferative retinopathy"
//         },
//         {
//           "icdCode": "E10.63",
//           "icdCodeDescription": "Type 1 diabetes mellitus with specified periodontal complication"
//         },
//         {
//           "icdCode": "E11.31",
//           "icdCodeDescription": "Type 2 diabetes mellitus with background retinopathy"
//         },
//         {
//           "icdCode": "E10.62",
//           "icdCodeDescription": "Type 1 diabetes mellitus with specified skin and subcutaneous tissue complication"
//         },
//         {
//           "icdCode": "E11.30",
//           "icdCodeDescription": "Type 2 diabetes mellitus with ophthalmic complication, unspecified"
//         },
//         {
//           "icdCode": "E10.61",
//           "icdCodeDescription": "Type 1 diabetes mellitus with specified diabetic musculoskeletal and connective tissue complication"
//         },
//         {
//           "icdCode": "E10.60",
//           "icdCodeDescription": "Insulin-dependent diabetes mellitus with other specified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "I24.8",
//           "icdCodeDescription": "Other forms of acute ischaemic heart disease"
//         },
//         {
//           "icdCode": "E11.39",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other specified ophthalmic complication"
//         },
//         {
//           "icdCode": "I24.9",
//           "icdCodeDescription": "Acute ischaemic heart disease, unspecified"
//         },
//         {
//           "icdCode": "E10.69",
//           "icdCodeDescription": "Type 1 diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "E11.36",
//           "icdCodeDescription": "Type 2 diabetes mellitus with diabetic cataract"
//         },
//         {
//           "icdCode": "E11.35",
//           "icdCodeDescription": "Type 2 diabetes mellitus with advanced ophthalmic disease"
//         },
//         {
//           "icdCode": "E11.34",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other retinopathy"
//         },
//         {
//           "icdCode": "E10.65",
//           "icdCodeDescription": "Type 1 diabetes mellitus with poor control"
//         },
//         {
//           "icdCode": "E11.33",
//           "icdCodeDescription": "Type 2 diabetes mellitus with proliferative retinopathy"
//         },
//         {
//           "icdCode": "I24.0",
//           "icdCodeDescription": "Coronary thrombosis not resulting in myocardial infarction"
//         },
//         {
//           "icdCode": "I24.1",
//           "icdCodeDescription": "Dresslers syndrome"
//         },
//         {
//           "icdCode": "E13.69",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "E14.36",
//           "icdCodeDescription": "Unspecified diabetes mellitus with diabetic cataract"
//         },
//         {
//           "icdCode": "E14.39",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified ophthalmic complication"
//         },
//         {
//           "icdCode": "E13.60",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.61",
//           "icdCodeDescription": "Other specified diabetes mellitus with specified diabetic musculoskeletal and connective tissue complication"
//         },
//         {
//           "icdCode": "E13.62",
//           "icdCodeDescription": "Other specified diabetes mellitus with specified skin and subcutaneous tissue complication"
//         },
//         {
//           "icdCode": "E14.31",
//           "icdCodeDescription": "Unspecified diabetes mellitus with background retinopathy"
//         },
//         {
//           "icdCode": "E13.63",
//           "icdCodeDescription": "Other specified diabetes mellitus with specified periodontal complication"
//         },
//         {
//           "icdCode": "E14.30",
//           "icdCodeDescription": "Unspecified diabetes mellitus with ophthalmic complication, unspecified"
//         },
//         {
//           "icdCode": "E13.64",
//           "icdCodeDescription": "Other specified diabetes mellitus with hypoglycaemia"
//         },
//         {
//           "icdCode": "E14.33",
//           "icdCodeDescription": "Unspecified diabetes mellitus with proliferative retinopathy"
//         },
//         {
//           "icdCode": "E13.65",
//           "icdCodeDescription": "Other specified diabetes mellitus with poor control"
//         },
//         {
//           "icdCode": "E14.32",
//           "icdCodeDescription": "Unspecified diabetes mellitus with preproliferative retinopathy"
//         },
//         {
//           "icdCode": "E14.35",
//           "icdCodeDescription": "Unspecified diabetes mellitus with advanced ophthalmic disease"
//         },
//         {
//           "icdCode": "E14.34",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other retinopathy"
//         },
//         {
//           "icdCode": "I73.8",
//           "icdCodeDescription": "Other specified peripheral vascular diseases"
//         },
//         {
//           "icdCode": "I73.9",
//           "icdCodeDescription": "Peripheral vascular disease, unspecified"
//         },
//         {
//           "icdCode": "E13.70",
//           "icdCodeDescription": "Other specified diabetes mellitus with multiple complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "I73.0",
//           "icdCodeDescription": "Raynauds syndrome"
//         },
//         {
//           "icdCode": "I73.1",
//           "icdCodeDescription": "Thromboangiitis obliterans [Buerger]"
//         },
//         {
//           "icdCode": "E78.0",
//           "icdCodeDescription": "Pure hypercholesterolaemia"
//         },
//         {
//           "icdCode": "E14.49",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified neurological complication"
//         },
//         {
//           "icdCode": "E13.71",
//           "icdCodeDescription": "Other specified diabetes mellitus with multiple microvascular complications"
//         },
//         {
//           "icdCode": "E14.40",
//           "icdCodeDescription": "Unspecified diabetes mellitus with unspecified neuropathy"
//         },
//         {
//           "icdCode": "E13.72",
//           "icdCodeDescription": "Other specified diabetes mellitus with features of insulin resistance"
//         },
//         {
//           "icdCode": "E78.8",
//           "icdCodeDescription": "Other disorders of lipoprotein metabolism"
//         },
//         {
//           "icdCode": "E78.5",
//           "icdCodeDescription": "Hyperlipidaemia, unspecified"
//         },
//         {
//           "icdCode": "E13.73",
//           "icdCodeDescription": "Other specified diabetes mellitus with foot ulcer due to multiple causes"
//         },
//         {
//           "icdCode": "E14.42",
//           "icdCodeDescription": "Unspecified diabetes mellitus with diabetic polyneuropathy"
//         },
//         {
//           "icdCode": "E14.41",
//           "icdCodeDescription": "Unspecified diabetes mellitus with diabetic mononeuropathy"
//         },
//         {
//           "icdCode": "E78.6",
//           "icdCodeDescription": "Lipoprotein deficiency"
//         },
//         {
//           "icdCode": "I69.8",
//           "icdCodeDescription": "Sequelae of other and unspecified cerebrovascular diseases"
//         },
//         {
//           "icdCode": "E78.3",
//           "icdCodeDescription": "Hyperchylomicronaemia"
//         },
//         {
//           "icdCode": "E10.02",
//           "icdCodeDescription": "Type 1 diabetes mellitus with hyperosmolarity with coma"
//         },
//         {
//           "icdCode": "I23.5",
//           "icdCodeDescription": "Rupture of papillary muscle as current complication following acute myocardial infarction"
//         },
//         {
//           "icdCode": "E78.4",
//           "icdCodeDescription": "Other hyperlipidaemia"
//         },
//         {
//           "icdCode": "E14.43",
//           "icdCodeDescription": "Unspecified diabetes mellitus with diabetic autonomic neuropathy"
//         },
//         {
//           "icdCode": "E10.01",
//           "icdCodeDescription": "Insulin-dependent diabetes mellitus with coma, stated as uncontrolled"
//         },
//         {
//           "icdCode": "I23.6",
//           "icdCodeDescription": "Thrombosis of atrium, auricular appendage, and ventricle as current complications following acute myocardial infarction"
//         },
//         {
//           "icdCode": "E78.1",
//           "icdCodeDescription": "Pure hyperglyceridaemia"
//         },
//         {
//           "icdCode": "E10.00",
//           "icdCodeDescription": "Insulin-dependent diabetes mellitus with coma, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "I69.3",
//           "icdCodeDescription": "Sequelae of cerebral infarction"
//         },
//         {
//           "icdCode": "I23.8",
//           "icdCodeDescription": "Other current complications following acute myocardial infarction"
//         },
//         {
//           "icdCode": "I69.4",
//           "icdCodeDescription": "Sequelae of stroke, not specified as haemorrhage or infarction"
//         },
//         {
//           "icdCode": "I23.1",
//           "icdCodeDescription": "Atrial septal defect as current complication following acute myocardial infarction"
//         },
//         {
//           "icdCode": "I23.2",
//           "icdCodeDescription": "Ventricular septal defect as current complication following acute myocardial infarction"
//         },
//         {
//           "icdCode": "I23.3",
//           "icdCodeDescription": "Rupture of cardiac wall without haemopericardium as current complication following acute myocardial infarction"
//         },
//         {
//           "icdCode": "I23.4",
//           "icdCodeDescription": "Rupture of chordae tendineae as current complication following acute myocardial infarction"
//         },
//         {
//           "icdCode": "E13.80",
//           "icdCodeDescription": "Other specified diabetes mellitus with unspecified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E78.9",
//           "icdCodeDescription": "Disorder of lipoprotein metabolism, unspecified"
//         },
//         {
//           "icdCode": "E13.81",
//           "icdCodeDescription": "Other specified diabetes mellitus with unspecified complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "I23.0",
//           "icdCodeDescription": "Haemopericardium as current complication following acute myocardial infarction"
//         },
//         {
//           "icdCode": "E14.59",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified circulatory complication"
//         },
//         {
//           "icdCode": "E14.51",
//           "icdCodeDescription": "Unspecified diabetes mellitus with peripheral angiopathy without gangrene"
//         },
//         {
//           "icdCode": "E14.50",
//           "icdCodeDescription": "Unspecified diabetes mellitus with circulatory complication, unspecified"
//         },
//         {
//           "icdCode": "E10.16",
//           "icdCodeDescription": "Type 1 diabetes mellitus with ketoacidosis, with lactic acidosis, with coma"
//         },
//         {
//           "icdCode": "E14.53",
//           "icdCodeDescription": "Unspecified diabetes mellitus with diabetic ischaemic cardiomyopathy"
//         },
//         {
//           "icdCode": "E10.15",
//           "icdCodeDescription": "Type 1 diabetes mellitus with ketoacidosis, with lactic acidosis, without coma"
//         },
//         {
//           "icdCode": "E14.52",
//           "icdCodeDescription": "Unspecified diabetes mellitus with peripheral angiopathy with gangrene"
//         },
//         {
//           "icdCode": "E10.14",
//           "icdCodeDescription": "Type 1 diabetes mellitus with lactic acidosis, with coma"
//         },
//         {
//           "icdCode": "E10.13",
//           "icdCodeDescription": "Type 1 diabetes mellitus with lactic acidosis, without coma"
//         },
//         {
//           "icdCode": "E10.12",
//           "icdCodeDescription": "Type 1 diabetes mellitus with ketoacidosis, with coma"
//         },
//         {
//           "icdCode": "E10.11",
//           "icdCodeDescription": "Type 1 diabetes mellitus with ketoacidosis, without coma"
//         },
//         {
//           "icdCode": "E10.10",
//           "icdCodeDescription": "Insulin-dependent diabetes mellitus with ketoacidosis, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "I72.5",
//           "icdCodeDescription": "Aneurysm and dissection of other precerebral arteries"
//         },
//         {
//           "icdCode": "E13.90",
//           "icdCodeDescription": "Other specified diabetes mellitus without complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.91",
//           "icdCodeDescription": "Other specified diabetes mellitus without complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E14.60",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "I72.3",
//           "icdCodeDescription": "Aneurysm of iliac artery"
//         },
//         {
//           "icdCode": "I72.4",
//           "icdCodeDescription": "Aneurysm of artery of lower extremity"
//         },
//         {
//           "icdCode": "I72.1",
//           "icdCodeDescription": "Aneurysm of artery of upper extremity"
//         },
//         {
//           "icdCode": "I72.2",
//           "icdCodeDescription": "Aneurysm of renal artery"
//         },
//         {
//           "icdCode": "I72.0",
//           "icdCodeDescription": "Aneurysm of carotid artery"
//         },
//         {
//           "icdCode": "E10.20",
//           "icdCodeDescription": "Type 1 diabetes mellitus with renal complication, unspecified"
//         },
//         {
//           "icdCode": "E14.69",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "E10.2",
//           "icdCodeDescription": "Type 1 diabetes mellitus with renal complication"
//         },
//         {
//           "icdCode": "R07.4",
//           "icdCodeDescription": "Chest pain, unspecified"
//         },
//         {
//           "icdCode": "E10.1",
//           "icdCodeDescription": "Type 1 diabetes mellitus with acidosis"
//         },
//         {
//           "icdCode": "E10.0",
//           "icdCodeDescription": "Insulin-dependent diabetes mellitus with coma"
//         },
//         {
//           "icdCode": "E10.6",
//           "icdCodeDescription": "Type 1 diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "E14.62",
//           "icdCodeDescription": "Unspecified diabetes mellitus with specified skin and subcutaneous tissue complication"
//         },
//         {
//           "icdCode": "E10.5",
//           "icdCodeDescription": "Type 1 diabetes mellitus with circulatory complication"
//         },
//         {
//           "icdCode": "E14.61",
//           "icdCodeDescription": "Unspecified diabetes mellitus with specified diabetic musculoskeletal and connective tissue complication"
//         },
//         {
//           "icdCode": "E10.4",
//           "icdCodeDescription": "Type 1 diabetes mellitus with neurological complication"
//         },
//         {
//           "icdCode": "E14.64",
//           "icdCodeDescription": "Unspecified diabetes mellitus with hypoglycaemia"
//         },
//         {
//           "icdCode": "E10.3",
//           "icdCodeDescription": "Type 1 diabetes mellitus with ophthalmic complication"
//         },
//         {
//           "icdCode": "E14.63",
//           "icdCodeDescription": "Unspecified diabetes mellitus with specified periodontal complication"
//         },
//         {
//           "icdCode": "E10.23",
//           "icdCodeDescription": "Type 1 diabetes mellitus with advanced renal disease"
//         },
//         {
//           "icdCode": "E10.9",
//           "icdCodeDescription": "Insulin-dependent diabetes mellitus without complications"
//         },
//         {
//           "icdCode": "E14.65",
//           "icdCodeDescription": "Unspecified diabetes mellitus with poor control"
//         },
//         {
//           "icdCode": "E10.8",
//           "icdCodeDescription": "Type 1 diabetes mellitus with unspecified complication"
//         },
//         {
//           "icdCode": "E10.22",
//           "icdCodeDescription": "Type 1 diabetes mellitus with established diabetic nephropathy"
//         },
//         {
//           "icdCode": "I22.8",
//           "icdCodeDescription": "Subsequent myocardial infarction of other sites"
//         },
//         {
//           "icdCode": "E10.7",
//           "icdCodeDescription": "Type 1 diabetes mellitus with multiple complications"
//         },
//         {
//           "icdCode": "E10.21",
//           "icdCodeDescription": "Type 1 diabetes mellitus with incipient diabetic nephropathy"
//         },
//         {
//           "icdCode": "I22.9",
//           "icdCodeDescription": "Subsequent myocardial infarction of unspecified site"
//         },
//         {
//           "icdCode": "K76.0",
//           "icdCodeDescription": "Fatty (change of) liver, not elsewhere classified"
//         },
//         {
//           "icdCode": "E14.71",
//           "icdCodeDescription": "Unspecified diabetes mellitus with multiple microvascular complications"
//         },
//         {
//           "icdCode": "I22.0",
//           "icdCodeDescription": "Subsequent myocardial infarction of anterior wall"
//         },
//         {
//           "icdCode": "E10.29",
//           "icdCodeDescription": "Type 1 diabetes mellitus with other specified renal complication"
//         },
//         {
//           "icdCode": "E14.70",
//           "icdCodeDescription": "Unspecified diabetes mellitus with multiple complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "I22.1",
//           "icdCodeDescription": "Subsequent myocardial infarction of inferior wall"
//         }
//       ]
//     },
//     {
//       "serviceCode": "0606245396",
//       "scientificCode": "7000000829-500-100000073665",
//       "suggestedIcds": []
//     },
//     {
//       "serviceCode": "1611211330",
//       "scientificCode": "7000000506-40-100000073665",
//       "suggestedIcds": [
//         {
//           "icdCode": "M10.9",
//           "icdCodeDescription": "Gout, unspecified"
//         },
//         {
//           "icdCode": "M10.09",
//           "icdCodeDescription": "Idiopathic gout, site unspecified"
//         },
//         {
//           "icdCode": "M14.0",
//           "icdCodeDescription": "Gouty arthropathy due to enzyme defects and other inherited disorders"
//         },
//         {
//           "icdCode": "M10",
//           "icdCodeDescription": "Gout"
//         },
//         {
//           "icdCode": "M10.34",
//           "icdCodeDescription": "Gout due to impairment of renal function, hand"
//         },
//         {
//           "icdCode": "M10.98",
//           "icdCodeDescription": "Gout, unspecified, other site"
//         },
//         {
//           "icdCode": "E79.0",
//           "icdCodeDescription": "Hyperuricaemia without signs of inflammatory arthritis and tophaceous disease"
//         },
//         {
//           "icdCode": "M10.99",
//           "icdCodeDescription": "Gout, unspecified, site unspecified"
//         },
//         {
//           "icdCode": "M10.00",
//           "icdCodeDescription": "Idiopathic gout, multiple sites"
//         },
//         {
//           "icdCode": "N23",
//           "icdCodeDescription": "Unspecified renal colic"
//         },
//         {
//           "icdCode": "M10.96",
//           "icdCodeDescription": "Gout, unspecified, lower leg"
//         },
//         {
//           "icdCode": "M10.30",
//           "icdCodeDescription": "Gout due to impairment of renal function, multiple sites"
//         },
//         {
//           "icdCode": "M10.97",
//           "icdCodeDescription": "Gout, unspecified, ankle and foot"
//         },
//         {
//           "icdCode": "N13.2",
//           "icdCodeDescription": "Hydronephrosis with renal and ureteral calculous obstruction"
//         },
//         {
//           "icdCode": "M10.94",
//           "icdCodeDescription": "Gout, unspecified, hand"
//         },
//         {
//           "icdCode": "M10.95",
//           "icdCodeDescription": "Gout, unspecified, pelvic region and thigh"
//         },
//         {
//           "icdCode": "M10.40",
//           "icdCodeDescription": "Other secondary gout, multiple sites"
//         },
//         {
//           "icdCode": "M10.92",
//           "icdCodeDescription": "Gout, unspecified, upper arm"
//         },
//         {
//           "icdCode": "M10.93",
//           "icdCodeDescription": "Gout, unspecified, forearm"
//         },
//         {
//           "icdCode": "M10.90",
//           "icdCodeDescription": "Gout, unspecified, multiple sites"
//         },
//         {
//           "icdCode": "M10.91",
//           "icdCodeDescription": "Gout, unspecified, shoulder region"
//         }
//       ]
//     },
//     {
//       "serviceCode": "53-22-02",
//       "scientificCode": "7000000155-2.5-100000073665",
//       "suggestedIcds": [
//         {
//           "icdCode": "Z95",
//           "icdCodeDescription": "Presence of cardiac and vascular implants and grafts"
//         },
//         {
//           "icdCode": "G43",
//           "icdCodeDescription": "Migraine"
//         },
//         {
//           "icdCode": "Q23.83",
//           "icdCodeDescription": "Congenital bicuspid aortic valve"
//         },
//         {
//           "icdCode": "G44",
//           "icdCodeDescription": "Other headache syndromes"
//         },
//         {
//           "icdCode": "I25.8",
//           "icdCodeDescription": "Other forms of chronic ischaemic heart disease"
//         },
//         {
//           "icdCode": "I48.9",
//           "icdCodeDescription": "Atrial fibrillation and atrial flutter, unspecified"
//         },
//         {
//           "icdCode": "I25.9",
//           "icdCodeDescription": "Chronic ischaemic heart disease, unspecified"
//         },
//         {
//           "icdCode": "I05",
//           "icdCodeDescription": "Rheumatic mitral valve diseases"
//         },
//         {
//           "icdCode": "I48.3",
//           "icdCodeDescription": "Typical atrial flutter"
//         },
//         {
//           "icdCode": "I44.7",
//           "icdCodeDescription": "Left bundle-branch block, unspecified"
//         },
//         {
//           "icdCode": "I48.2",
//           "icdCodeDescription": "Chronic atrial fibrillation"
//         },
//         {
//           "icdCode": "I21.9",
//           "icdCodeDescription": "Acute myocardial infarction, unspecified"
//         },
//         {
//           "icdCode": "I25.5",
//           "icdCodeDescription": "Ischaemic cardiomyopathy"
//         },
//         {
//           "icdCode": "I48.4",
//           "icdCodeDescription": "Atypical atrial flutter"
//         },
//         {
//           "icdCode": "I21.3",
//           "icdCodeDescription": "Acute transmural myocardial infarction of unspecified site"
//         },
//         {
//           "icdCode": "I21.4",
//           "icdCodeDescription": "Acute subendocardial myocardial infarction"
//         },
//         {
//           "icdCode": "I25.0",
//           "icdCodeDescription": "Atherosclerotic cardiovascular disease, so described"
//         },
//         {
//           "icdCode": "I25.1",
//           "icdCodeDescription": "Atherosclerotic heart disease"
//         },
//         {
//           "icdCode": "I48.1",
//           "icdCodeDescription": "Persistent atrial fibrillation"
//         },
//         {
//           "icdCode": "I25.2",
//           "icdCodeDescription": "Old myocardial infarction"
//         },
//         {
//           "icdCode": "I48.0",
//           "icdCodeDescription": "Paroxysmal atrial fibrillation"
//         },
//         {
//           "icdCode": "I21.0",
//           "icdCodeDescription": "Acute transmural myocardial infarction of anterior wall"
//         },
//         {
//           "icdCode": "I21.1",
//           "icdCodeDescription": "Acute transmural myocardial infarction of inferior wall"
//         },
//         {
//           "icdCode": "I21.2",
//           "icdCodeDescription": "Acute transmural myocardial infarction of other sites"
//         },
//         {
//           "icdCode": "I70.24",
//           "icdCodeDescription": "Atherosclerosis of arteries of extremities with gangrene"
//         },
//         {
//           "icdCode": "I10",
//           "icdCodeDescription": "Essential (primary) hypertension"
//         },
//         {
//           "icdCode": "I12",
//           "icdCodeDescription": "Hypertensive renal disease"
//         },
//         {
//           "icdCode": "I11",
//           "icdCodeDescription": "Hypertensive heart disease"
//         },
//         {
//           "icdCode": "I25.11",
//           "icdCodeDescription": "Atherosclerotic heart disease, of native coronary artery"
//         },
//         {
//           "icdCode": "I13",
//           "icdCodeDescription": "Hypertensive heart and renal disease"
//         },
//         {
//           "icdCode": "I13.9",
//           "icdCodeDescription": "Hypertensive heart and renal disease, unspecified"
//         },
//         {
//           "icdCode": "I51.7",
//           "icdCodeDescription": "Cardiomegaly"
//         },
//         {
//           "icdCode": "I51.6",
//           "icdCodeDescription": "Cardiovascular disease, unspecified"
//         },
//         {
//           "icdCode": "Z95.5",
//           "icdCodeDescription": "Presence of coronary angioplasty implant and graft"
//         },
//         {
//           "icdCode": "I51.9",
//           "icdCodeDescription": "Heart disease, unspecified"
//         },
//         {
//           "icdCode": "Z95.3",
//           "icdCodeDescription": "Presence of xenogenic heart valve"
//         },
//         {
//           "icdCode": "I13.2",
//           "icdCodeDescription": "Hypertensive heart and renal disease with both (congestive) heart failure and renal failure"
//         },
//         {
//           "icdCode": "I70.8",
//           "icdCodeDescription": "Atherosclerosis of other arteries"
//         },
//         {
//           "icdCode": "Z95.4",
//           "icdCodeDescription": "Presence of other heart-valve replacement"
//         },
//         {
//           "icdCode": "I13.1",
//           "icdCodeDescription": "Hypertensive heart and renal disease with renal failure"
//         },
//         {
//           "icdCode": "Z95.1",
//           "icdCodeDescription": "Presence of aortocoronary bypass graft"
//         },
//         {
//           "icdCode": "I13.0",
//           "icdCodeDescription": "Hypertensive heart and renal disease with (congestive) heart failure"
//         },
//         {
//           "icdCode": "I51.4",
//           "icdCodeDescription": "Myocarditis, unspecified"
//         },
//         {
//           "icdCode": "Z95.2",
//           "icdCodeDescription": "Presence of prosthetic heart valve"
//         },
//         {
//           "icdCode": "I70.0",
//           "icdCodeDescription": "Atherosclerosis of aorta"
//         },
//         {
//           "icdCode": "I05.9",
//           "icdCodeDescription": "Mitral valve disease, unspecified"
//         },
//         {
//           "icdCode": "I21",
//           "icdCodeDescription": "Acute myocardial infarction"
//         },
//         {
//           "icdCode": "I20",
//           "icdCodeDescription": "Angina pectoris"
//         },
//         {
//           "icdCode": "I24.8",
//           "icdCodeDescription": "Other forms of acute ischaemic heart disease"
//         },
//         {
//           "icdCode": "G43.1",
//           "icdCodeDescription": "Migraine with aura [classical migraine]"
//         },
//         {
//           "icdCode": "I22",
//           "icdCodeDescription": "Subsequent myocardial infarction"
//         },
//         {
//           "icdCode": "I24.9",
//           "icdCodeDescription": "Acute ischaemic heart disease, unspecified"
//         },
//         {
//           "icdCode": "I25",
//           "icdCodeDescription": "Chronic ischaemic heart disease"
//         },
//         {
//           "icdCode": "I05.2",
//           "icdCodeDescription": "Mitral stenosis with insufficiency"
//         },
//         {
//           "icdCode": "I47.9",
//           "icdCodeDescription": "Paroxysmal tachycardia, unspecified"
//         },
//         {
//           "icdCode": "I24",
//           "icdCodeDescription": "Other acute ischaemic heart diseases"
//         },
//         {
//           "icdCode": "I20.8",
//           "icdCodeDescription": "Other forms of angina pectoris"
//         },
//         {
//           "icdCode": "I05.8",
//           "icdCodeDescription": "Other mitral valve diseases"
//         },
//         {
//           "icdCode": "I20.9",
//           "icdCodeDescription": "Angina pectoris, unspecified"
//         },
//         {
//           "icdCode": "Z95.9",
//           "icdCodeDescription": "Presence of cardiac and vascular implant and graft, unspecified"
//         },
//         {
//           "icdCode": "G43.9",
//           "icdCodeDescription": "Migraine, unspecified"
//         },
//         {
//           "icdCode": "I47.2",
//           "icdCodeDescription": "Ventricular tachycardia"
//         },
//         {
//           "icdCode": "I47.1",
//           "icdCodeDescription": "Supraventricular tachycardia"
//         },
//         {
//           "icdCode": "I20.0",
//           "icdCodeDescription": "Unstable angina"
//         },
//         {
//           "icdCode": "I05.0",
//           "icdCodeDescription": "Mitral stenosis"
//         },
//         {
//           "icdCode": "I20.1",
//           "icdCodeDescription": "Angina pectoris with documented spasm"
//         },
//         {
//           "icdCode": "O90.3",
//           "icdCodeDescription": "Cardiomyopathy in the puerperium"
//         },
//         {
//           "icdCode": "I35.8",
//           "icdCodeDescription": "Other aortic valve disorders"
//         },
//         {
//           "icdCode": "I35.9",
//           "icdCodeDescription": "Aortic valve disorder, unspecified"
//         },
//         {
//           "icdCode": "R51",
//           "icdCodeDescription": "Headache"
//         },
//         {
//           "icdCode": "I39.0",
//           "icdCodeDescription": "Mitral valve disorders in diseases classified elsewhere"
//         },
//         {
//           "icdCode": "I39.1",
//           "icdCodeDescription": "Aortic valve disorders in diseases classified elsewhere"
//         },
//         {
//           "icdCode": "I97.82",
//           "icdCodeDescription": "Pacemaker syndrome"
//         },
//         {
//           "icdCode": "I12.9",
//           "icdCodeDescription": "Hypertensive renal disease without renal failure"
//         },
//         {
//           "icdCode": "I12.0",
//           "icdCodeDescription": "Hypertensive renal disease with renal failure"
//         },
//         {
//           "icdCode": "I35.0",
//           "icdCodeDescription": "Aortic (valve) stenosis"
//         },
//         {
//           "icdCode": "I35.1",
//           "icdCodeDescription": "Aortic (valve) insufficiency"
//         },
//         {
//           "icdCode": "I35.2",
//           "icdCodeDescription": "Aortic (valve) stenosis with insufficiency"
//         },
//         {
//           "icdCode": "I50.9",
//           "icdCodeDescription": "Heart failure, unspecified"
//         },
//         {
//           "icdCode": "I50.0",
//           "icdCodeDescription": "Congestive heart failure"
//         },
//         {
//           "icdCode": "I50.1",
//           "icdCodeDescription": "Left ventricular failure"
//         },
//         {
//           "icdCode": "I42",
//           "icdCodeDescription": "Cardiomyopathy"
//         },
//         {
//           "icdCode": "I08.0",
//           "icdCodeDescription": "Disorders of both mitral and aortic valves"
//         },
//         {
//           "icdCode": "I44",
//           "icdCodeDescription": "Atrioventricular and left bundle-branch block"
//         },
//         {
//           "icdCode": "R00.0",
//           "icdCodeDescription": "Tachycardia, unspecified"
//         },
//         {
//           "icdCode": "I47",
//           "icdCodeDescription": "Paroxysmal tachycardia"
//         },
//         {
//           "icdCode": "I49",
//           "icdCodeDescription": "Other cardiac arrhythmias"
//         },
//         {
//           "icdCode": "I42.9",
//           "icdCodeDescription": "Cardiomyopathy, unspecified"
//         },
//         {
//           "icdCode": "I48",
//           "icdCodeDescription": "Atrial fibrillation and flutter"
//         },
//         {
//           "icdCode": "I27.2",
//           "icdCodeDescription": "Other secondary pulmonary hypertension"
//         },
//         {
//           "icdCode": "I42.8",
//           "icdCodeDescription": "Other cardiomyopathies"
//         },
//         {
//           "icdCode": "R00.2",
//           "icdCodeDescription": "Palpitations"
//         },
//         {
//           "icdCode": "I08.2",
//           "icdCodeDescription": "Disorders of both aortic and tricuspid valves"
//         },
//         {
//           "icdCode": "I42.7",
//           "icdCodeDescription": "Cardiomyopathy due to drugs and other external agents"
//         },
//         {
//           "icdCode": "I42.1",
//           "icdCodeDescription": "Obstructive hypertrophic cardiomyopathy"
//         },
//         {
//           "icdCode": "I42.0",
//           "icdCodeDescription": "Dilated cardiomyopathy"
//         },
//         {
//           "icdCode": "I42.2",
//           "icdCodeDescription": "Other hypertrophic cardiomyopathy"
//         },
//         {
//           "icdCode": "I50",
//           "icdCodeDescription": "Heart failure"
//         },
//         {
//           "icdCode": "I11.9",
//           "icdCodeDescription": "Hypertensive heart disease without (congestive) heart failure"
//         },
//         {
//           "icdCode": "I15.2",
//           "icdCodeDescription": "Hypertension secondary to endocrine disorders"
//         },
//         {
//           "icdCode": "I15.9",
//           "icdCodeDescription": "Secondary hypertension, unspecified"
//         },
//         {
//           "icdCode": "I15.8",
//           "icdCodeDescription": "Other secondary hypertension"
//         },
//         {
//           "icdCode": "I34.1",
//           "icdCodeDescription": "Mitral (valve) prolapse"
//         },
//         {
//           "icdCode": "I11.0",
//           "icdCodeDescription": "Hypertensive heart disease with (congestive) heart failure"
//         },
//         {
//           "icdCode": "I15.1",
//           "icdCodeDescription": "Hypertension secondary to other renal disorders"
//         },
//         {
//           "icdCode": "I34.0",
//           "icdCodeDescription": "Mitral (valve) insufficiency"
//         },
//         {
//           "icdCode": "R07.1",
//           "icdCodeDescription": "Chest pain on breathing"
//         },
//         {
//           "icdCode": "R07.4",
//           "icdCodeDescription": "Chest pain, unspecified"
//         },
//         {
//           "icdCode": "I49.9",
//           "icdCodeDescription": "Cardiac arrhythmia, unspecified"
//         },
//         {
//           "icdCode": "R07.3",
//           "icdCodeDescription": "Other chest pain"
//         },
//         {
//           "icdCode": "I49.8",
//           "icdCodeDescription": "Other specified cardiac arrhythmias"
//         },
//         {
//           "icdCode": "K76.6",
//           "icdCodeDescription": "Portal hypertension"
//         },
//         {
//           "icdCode": "I49.1",
//           "icdCodeDescription": "Atrial premature depolarisation"
//         },
//         {
//           "icdCode": "I22.8",
//           "icdCodeDescription": "Subsequent myocardial infarction of other sites"
//         },
//         {
//           "icdCode": "I22.9",
//           "icdCodeDescription": "Subsequent myocardial infarction of unspecified site"
//         },
//         {
//           "icdCode": "I49.3",
//           "icdCodeDescription": "Ventricular premature depolarisation"
//         },
//         {
//           "icdCode": "I22.0",
//           "icdCodeDescription": "Subsequent myocardial infarction of anterior wall"
//         },
//         {
//           "icdCode": "U82.1",
//           "icdCodeDescription": "Ischaemic heart disease"
//         },
//         {
//           "icdCode": "U82.2",
//           "icdCodeDescription": "Chronic heart failure"
//         },
//         {
//           "icdCode": "U82.3",
//           "icdCodeDescription": "Hypertension"
//         }
//       ]
//     },
//     {
//       "serviceCode": "57-370-15",
//       "scientificCode": "14000002146-1050-100000073665",
//       "suggestedIcds": [
//         {
//           "icdCode": "E13.29",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified renal complication"
//         },
//         {
//           "icdCode": "E11.81",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with unspecified complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.80",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with unspecified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E12.50",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with peripheral circulatory complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E12.51",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with peripheral circulatory complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.20",
//           "icdCodeDescription": "Other specified diabetes mellitus with renal complication, unspecified"
//         },
//         {
//           "icdCode": "E13.21",
//           "icdCodeDescription": "Other specified diabetes mellitus with incipient diabetic nephropathy"
//         },
//         {
//           "icdCode": "E13.22",
//           "icdCodeDescription": "Other specified diabetes mellitus with established diabetic nephropathy"
//         },
//         {
//           "icdCode": "E13.23",
//           "icdCodeDescription": "Other specified diabetes mellitus with advanced renal disease"
//         },
//         {
//           "icdCode": "E11.90",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus without complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.35",
//           "icdCodeDescription": "Other specified diabetes mellitus with advanced ophthalmic disease"
//         },
//         {
//           "icdCode": "E13.36",
//           "icdCodeDescription": "Other specified diabetes mellitus with diabetic cataract"
//         },
//         {
//           "icdCode": "E11.1",
//           "icdCodeDescription": "Type 2 diabetes mellitus with acidosis"
//         },
//         {
//           "icdCode": "E13.39",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified ophthalmic complication"
//         },
//         {
//           "icdCode": "E11.0",
//           "icdCodeDescription": "Type 2 diabetes mellitus with hyperosmolarity"
//         },
//         {
//           "icdCode": "G63.2",
//           "icdCodeDescription": "Diabetic polyneuropathy"
//         },
//         {
//           "icdCode": "E11.91",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus without complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.5",
//           "icdCodeDescription": "Type 2 diabetes mellitus with circulatory complciation"
//         },
//         {
//           "icdCode": "E11.4",
//           "icdCodeDescription": "Type 2 diabetes mellitus with neurological complication"
//         },
//         {
//           "icdCode": "E12.60",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with other specified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.3",
//           "icdCodeDescription": "Type 2 diabetes mellitus with ophthalmic complication"
//         },
//         {
//           "icdCode": "E12.61",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with other specified complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.2",
//           "icdCodeDescription": "Type 2 diabetes mellitus with renal complication"
//         },
//         {
//           "icdCode": "E13.30",
//           "icdCodeDescription": "Other specified diabetes mellitus with ophthalmic complication, unspecified"
//         },
//         {
//           "icdCode": "E11.9",
//           "icdCodeDescription": "Type 2 diabetes mellitus without complication"
//         },
//         {
//           "icdCode": "E13.31",
//           "icdCodeDescription": "Other specified diabetes mellitus with background retinopathy"
//         },
//         {
//           "icdCode": "E14.00",
//           "icdCodeDescription": "Unspecified diabetes mellitus with coma, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.8",
//           "icdCodeDescription": "Type 2 diabetes mellitus with unspecified complication"
//         },
//         {
//           "icdCode": "E13.32",
//           "icdCodeDescription": "Other specified diabetes mellitus with preproliferative retinopathy"
//         },
//         {
//           "icdCode": "E11.7",
//           "icdCodeDescription": "Type 2 diabetes mellitus with multiple complications"
//         },
//         {
//           "icdCode": "E13.33",
//           "icdCodeDescription": "Other specified diabetes mellitus with proliferative retinopathy"
//         },
//         {
//           "icdCode": "E14.02",
//           "icdCodeDescription": "Unspecified diabetes mellitus with hyperosmolarity, with coma"
//         },
//         {
//           "icdCode": "E11.6",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "E13.34",
//           "icdCodeDescription": "Other specified diabetes mellitus with other retinopathy"
//         },
//         {
//           "icdCode": "E14.01",
//           "icdCodeDescription": "Unspecified diabetes mellitus with hyperosmolarity, without nonketotic hyperglycaemic-hyperosmolar coma [NKHHC]"
//         },
//         {
//           "icdCode": "E14.15",
//           "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, with lactic acidosis, without coma"
//         },
//         {
//           "icdCode": "E14.14",
//           "icdCodeDescription": "Unspecified diabetes mellitus with lactic acidosis, with coma"
//         },
//         {
//           "icdCode": "E13.49",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified neurological complication"
//         },
//         {
//           "icdCode": "E14.16",
//           "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, with lactic acidosis, with coma"
//         },
//         {
//           "icdCode": "I10",
//           "icdCodeDescription": "Essential (primary) hypertension"
//         },
//         {
//           "icdCode": "E12.70",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with multiple complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E12.71",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with multiple complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.40",
//           "icdCodeDescription": "Other specified diabetes mellitus with unspecified neuropathy"
//         },
//         {
//           "icdCode": "E13.41",
//           "icdCodeDescription": "Other specified diabetes mellitus with diabetic mononeuropathy"
//         },
//         {
//           "icdCode": "E13.42",
//           "icdCodeDescription": "Other specified diabetes mellitus with diabetic polyneuropathy"
//         },
//         {
//           "icdCode": "E14.11",
//           "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, without coma"
//         },
//         {
//           "icdCode": "E13.43",
//           "icdCodeDescription": "Other specified diabetes mellitus with diabetic autonomic neuropathy"
//         },
//         {
//           "icdCode": "E14.10",
//           "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "G59.0",
//           "icdCodeDescription": "Diabetic mononeuropathy"
//         },
//         {
//           "icdCode": "E14.13",
//           "icdCodeDescription": "Unspecified diabetes mellitus with lactic acidosis, without coma"
//         },
//         {
//           "icdCode": "E12.80",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with unspecified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.59",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified circulatory complication"
//         },
//         {
//           "icdCode": "E12.0",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with coma"
//         },
//         {
//           "icdCode": "E14.29",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified renal complication"
//         },
//         {
//           "icdCode": "E12.4",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with neurological complications"
//         },
//         {
//           "icdCode": "E12.81",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with unspecified complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E12.3",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with ophthalmic complications"
//         },
//         {
//           "icdCode": "E13.50",
//           "icdCodeDescription": "Other specified diabetes mellitus with circulatory complication, unspecified"
//         },
//         {
//           "icdCode": "E12.2",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with renal complications"
//         },
//         {
//           "icdCode": "E13.51",
//           "icdCodeDescription": "Other specified diabetes mellitus with peripheral angiopathy without gangrene"
//         },
//         {
//           "icdCode": "E14.20",
//           "icdCodeDescription": "Unspecified diabetes mellitus with renal complication, unspecified"
//         },
//         {
//           "icdCode": "E12.1",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with ketoacidosis"
//         },
//         {
//           "icdCode": "E13.52",
//           "icdCodeDescription": "Other specified diabetes mellitus with peripheral angiopathy with gangrene"
//         },
//         {
//           "icdCode": "E12.8",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with unspecified complications"
//         },
//         {
//           "icdCode": "E13.53",
//           "icdCodeDescription": "Other specified diabetes mellitus with diabetic ischaemic cardiomyopathy"
//         },
//         {
//           "icdCode": "E14.22",
//           "icdCodeDescription": "Unspecified diabetes mellitus with established diabetic nephropathy"
//         },
//         {
//           "icdCode": "E12.7",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with multiple complications"
//         },
//         {
//           "icdCode": "E14.21",
//           "icdCodeDescription": "Unspecified diabetes mellitus with incipient diabetic nephropathy"
//         },
//         {
//           "icdCode": "E12.6",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with other specified complications"
//         },
//         {
//           "icdCode": "E12.5",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with peripheral circulatory complications"
//         },
//         {
//           "icdCode": "E14.23",
//           "icdCodeDescription": "Unspecified diabetes mellitus with advanced renal disease"
//         },
//         {
//           "icdCode": "E12.9",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus without complications"
//         },
//         {
//           "icdCode": "E12.90",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus without complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E12.91",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus without complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.43",
//           "icdCodeDescription": "Type 2 diabetes mellitus with diabetic autonomic neuropathy"
//         },
//         {
//           "icdCode": "E11.42",
//           "icdCodeDescription": "Type 2 diabetes mellitus with diabetic polyneuropathy"
//         },
//         {
//           "icdCode": "E11.41",
//           "icdCodeDescription": "Type 2 diabetes mellitus with diabetic mononeuropathy"
//         },
//         {
//           "icdCode": "E11.40",
//           "icdCodeDescription": "Type 2 diabetes mellitus with unspecified neuropathy"
//         },
//         {
//           "icdCode": "E11.49",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other specified neurological complication"
//         },
//         {
//           "icdCode": "E09.0",
//           "icdCodeDescription": "Impaired glucose regulation with peripheral angiopathy"
//         },
//         {
//           "icdCode": "E12.10",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with ketoacidosis, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E12.11",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with ketoacidosis, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E09.1",
//           "icdCodeDescription": "Impaired glucose regulation with features of insulin resistance"
//         },
//         {
//           "icdCode": "E09.8",
//           "icdCodeDescription": "Impaired glucose regulation with unspecified complication"
//         },
//         {
//           "icdCode": "E09.9",
//           "icdCodeDescription": "Impaired glucose regulation without complication"
//         },
//         {
//           "icdCode": "E11.53",
//           "icdCodeDescription": "Type 2 diabetes mellitus with diabetic ischaemic cardiomyopathy"
//         },
//         {
//           "icdCode": "E11.52",
//           "icdCodeDescription": "Type 2 diabetes mellitus with peripheral angiopathy with gangrene"
//         },
//         {
//           "icdCode": "E11.51",
//           "icdCodeDescription": "Type 2 diabetes mellitus with peripheral angiopathy without gangrene"
//         },
//         {
//           "icdCode": "E11.50",
//           "icdCodeDescription": "Type 2 diabetes mellitus with circulatory complication, unspecified"
//         },
//         {
//           "icdCode": "E13.3",
//           "icdCodeDescription": "Other specified diabetes mellitus with ophthalmic complication"
//         },
//         {
//           "icdCode": "E13.2",
//           "icdCodeDescription": "Other specified diabetes mellitus with renal complication"
//         },
//         {
//           "icdCode": "E13.1",
//           "icdCodeDescription": "Other specified diabetes mellitus with acidosis"
//         },
//         {
//           "icdCode": "E11.59",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other specified circulatory complication"
//         },
//         {
//           "icdCode": "E13.0",
//           "icdCodeDescription": "Other specified diabetes mellitus with hyperosmolarity"
//         },
//         {
//           "icdCode": "E13.7",
//           "icdCodeDescription": "Other specified diabetes mellitus with multiple complications"
//         },
//         {
//           "icdCode": "E12.20",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with renal complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.6",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "E12.21",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with renal complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.5",
//           "icdCodeDescription": "Other specified diabetes mellitus with circulatory complication"
//         },
//         {
//           "icdCode": "E13.4",
//           "icdCodeDescription": "Other specified diabetes mellitus with neurological complication"
//         },
//         {
//           "icdCode": "E13.9",
//           "icdCodeDescription": "Other specified diabetes mellitus without complication"
//         },
//         {
//           "icdCode": "E13.8",
//           "icdCodeDescription": "Other specified diabetes mellitus with unspecified complication"
//         },
//         {
//           "icdCode": "E11.65",
//           "icdCodeDescription": "Type 2 diabetes mellitus with poor control"
//         },
//         {
//           "icdCode": "E13.02",
//           "icdCodeDescription": "Other specified diabetes mellitus with hyperosmolarity, with coma"
//         },
//         {
//           "icdCode": "E11.64",
//           "icdCodeDescription": "Type 2 diabetes mellitus with hypoglycaemia"
//         },
//         {
//           "icdCode": "E11.63",
//           "icdCodeDescription": "Type 2 diabetes mellitus with specified periodontal complication"
//         },
//         {
//           "icdCode": "E11.62",
//           "icdCodeDescription": "Type 2 diabetes mellitus with specified skin and subcutaneous tissue complication"
//         },
//         {
//           "icdCode": "E11.61",
//           "icdCodeDescription": "Type 2 diabetes mellitus with specified diabetic musculoskeletal and connective tissue complication"
//         },
//         {
//           "icdCode": "E11.60",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with other specified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.69",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "E12.30",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with ophthalmic complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "R73",
//           "icdCodeDescription": "Elevated blood glucose level"
//         },
//         {
//           "icdCode": "E12.31",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with ophthalmic complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.00",
//           "icdCodeDescription": "Other specified diabetes mellitus with coma, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.01",
//           "icdCodeDescription": "Other specified diabetes mellitus with hyperosmolarity, without nonketotic hyperglycaemic-hyperosmolar coma [NKHHC]"
//         },
//         {
//           "icdCode": "E13.13",
//           "icdCodeDescription": "Other specified diabetes mellitus with lactic acidosis, without coma"
//         },
//         {
//           "icdCode": "E13.14",
//           "icdCodeDescription": "Other specified diabetes mellitus with lactic acidosis, with coma"
//         },
//         {
//           "icdCode": "H28.0",
//           "icdCodeDescription": "Diabetic cataract"
//         },
//         {
//           "icdCode": "E13.15",
//           "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, with lactic acidosis, without coma"
//         },
//         {
//           "icdCode": "E11.73",
//           "icdCodeDescription": "Type 2 diabetes mellitus with foot ulcer due to multiple causes"
//         },
//         {
//           "icdCode": "E13.16",
//           "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, with lactic acidosis, with coma"
//         },
//         {
//           "icdCode": "E11.72",
//           "icdCodeDescription": "Type 2 diabetes mellitus with features of insulin resistance"
//         },
//         {
//           "icdCode": "E11.71",
//           "icdCodeDescription": "Type 2 diabetes mellitus with multiple microvascular complications"
//         },
//         {
//           "icdCode": "E11.70",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with multiple complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E14.2",
//           "icdCodeDescription": "Unspecified diabetes mellitus with renal complication"
//         },
//         {
//           "icdCode": "E14.1",
//           "icdCodeDescription": "Unspecified diabetes mellitus with acidosis"
//         },
//         {
//           "icdCode": "E14.0",
//           "icdCodeDescription": "Unspecified diabetes mellitus with hyperosmolarity"
//         },
//         {
//           "icdCode": "E12.40",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with neurological complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E12.41",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with neurological complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E14.6",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "E13.10",
//           "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E14.5",
//           "icdCodeDescription": "Unspecified diabetes mellitus with circulatory complication"
//         },
//         {
//           "icdCode": "E13.11",
//           "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, without coma"
//         },
//         {
//           "icdCode": "E14.4",
//           "icdCodeDescription": "Unspecified diabetes mellitus with neurological complication"
//         },
//         {
//           "icdCode": "E13.12",
//           "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, with coma"
//         },
//         {
//           "icdCode": "E14.3",
//           "icdCodeDescription": "Unspecified diabetes mellitus with ophthalmic complication"
//         },
//         {
//           "icdCode": "E14.9",
//           "icdCodeDescription": "Unspecified diabetes mellitus without complication"
//         },
//         {
//           "icdCode": "E14.8",
//           "icdCodeDescription": "Unspecified diabetes mellitus with unspecified complication"
//         },
//         {
//           "icdCode": "E14.7",
//           "icdCodeDescription": "Unspecified diabetes mellitus with multiple complications"
//         },
//         {
//           "icdCode": "E14.73",
//           "icdCodeDescription": "Unspecified diabetes mellitus with foot ulcer due to multiple causes"
//         },
//         {
//           "icdCode": "E14.72",
//           "icdCodeDescription": "Unspecified diabetes mellitus with features of insulin resistance"
//         },
//         {
//           "icdCode": "E11.02",
//           "icdCodeDescription": "Type 2 diabetes mellitus with hyperosmolarity with coma"
//         },
//         {
//           "icdCode": "E11.01",
//           "icdCodeDescription": "Type 2 diabetes mellitus with hyperosmolarity without nonketotic hyperglycaemic-hyperosmolar coma [NKHHC]"
//         },
//         {
//           "icdCode": "E11.00",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with coma, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E14.80",
//           "icdCodeDescription": "Unspecified diabetes mellitus with unspecified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E14.81",
//           "icdCodeDescription": "Unspecified diabetes mellitus with unspecified complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.16",
//           "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, with lactic acidosis, with coma"
//         },
//         {
//           "icdCode": "E11.15",
//           "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, with lactic acidosis, without coma"
//         },
//         {
//           "icdCode": "E11.14",
//           "icdCodeDescription": "Type 2 diabetes mellitus with lactic acidosis, with coma"
//         },
//         {
//           "icdCode": "E09",
//           "icdCodeDescription": "Impaired glucose regulation"
//         },
//         {
//           "icdCode": "E11.13",
//           "icdCodeDescription": "Type 2 diabetes mellitus with lactic acidosis, without coma"
//         },
//         {
//           "icdCode": "E11.12",
//           "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, with coma"
//         },
//         {
//           "icdCode": "E11.11",
//           "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, without coma"
//         },
//         {
//           "icdCode": "E14.91",
//           "icdCodeDescription": "Unspecified diabetes mellitus without complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E14.90",
//           "icdCodeDescription": "Unspecified diabetes mellitus without complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.21",
//           "icdCodeDescription": "Type 2 diabetes mellitus with incipient diabetic nephropathy"
//         },
//         {
//           "icdCode": "E11.20",
//           "icdCodeDescription": "Type 2 diabetes mellitus with renal complication, unspecified"
//         },
//         {
//           "icdCode": "E12",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus"
//         },
//         {
//           "icdCode": "E11",
//           "icdCodeDescription": "Type 2 diabetes mellitus"
//         },
//         {
//           "icdCode": "E14",
//           "icdCodeDescription": "Unspecified diabetes mellitus"
//         },
//         {
//           "icdCode": "E13",
//           "icdCodeDescription": "Other specified diabetes mellitus"
//         },
//         {
//           "icdCode": "M14.2",
//           "icdCodeDescription": "Diabetic arthropathy"
//         },
//         {
//           "icdCode": "E11.29",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other specified renal complication"
//         },
//         {
//           "icdCode": "M10",
//           "icdCodeDescription": "Gout"
//         },
//         {
//           "icdCode": "E11.23",
//           "icdCodeDescription": "Type 2 diabetes mellitus with advanced renal disease"
//         },
//         {
//           "icdCode": "E11.22",
//           "icdCodeDescription": "Type 2 diabetes mellitus with established diabetic nephropathy"
//         },
//         {
//           "icdCode": "N08.3",
//           "icdCodeDescription": "Glomerular disorders in diabetes mellitus (E10-E14+ with common fourth character .2)"
//         },
//         {
//           "icdCode": "E11.32",
//           "icdCodeDescription": "Type 2 diabetes mellitus with preproliferative retinopathy"
//         },
//         {
//           "icdCode": "E11.31",
//           "icdCodeDescription": "Type 2 diabetes mellitus with background retinopathy"
//         },
//         {
//           "icdCode": "E11.30",
//           "icdCodeDescription": "Type 2 diabetes mellitus with ophthalmic complication, unspecified"
//         },
//         {
//           "icdCode": "E11.39",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other specified ophthalmic complication"
//         },
//         {
//           "icdCode": "E11.36",
//           "icdCodeDescription": "Type 2 diabetes mellitus with diabetic cataract"
//         },
//         {
//           "icdCode": "E11.35",
//           "icdCodeDescription": "Type 2 diabetes mellitus with advanced ophthalmic disease"
//         },
//         {
//           "icdCode": "E11.34",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other retinopathy"
//         },
//         {
//           "icdCode": "E11.33",
//           "icdCodeDescription": "Type 2 diabetes mellitus with proliferative retinopathy"
//         },
//         {
//           "icdCode": "E12.00",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with coma, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.69",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "E14.36",
//           "icdCodeDescription": "Unspecified diabetes mellitus with diabetic cataract"
//         },
//         {
//           "icdCode": "E14.39",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified ophthalmic complication"
//         },
//         {
//           "icdCode": "E13.60",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.61",
//           "icdCodeDescription": "Other specified diabetes mellitus with specified diabetic musculoskeletal and connective tissue complication"
//         },
//         {
//           "icdCode": "E13.62",
//           "icdCodeDescription": "Other specified diabetes mellitus with specified skin and subcutaneous tissue complication"
//         },
//         {
//           "icdCode": "E14.31",
//           "icdCodeDescription": "Unspecified diabetes mellitus with background retinopathy"
//         },
//         {
//           "icdCode": "E13.63",
//           "icdCodeDescription": "Other specified diabetes mellitus with specified periodontal complication"
//         },
//         {
//           "icdCode": "E14.30",
//           "icdCodeDescription": "Unspecified diabetes mellitus with ophthalmic complication, unspecified"
//         },
//         {
//           "icdCode": "E13.64",
//           "icdCodeDescription": "Other specified diabetes mellitus with hypoglycaemia"
//         },
//         {
//           "icdCode": "E14.33",
//           "icdCodeDescription": "Unspecified diabetes mellitus with proliferative retinopathy"
//         },
//         {
//           "icdCode": "E13.65",
//           "icdCodeDescription": "Other specified diabetes mellitus with poor control"
//         },
//         {
//           "icdCode": "E14.32",
//           "icdCodeDescription": "Unspecified diabetes mellitus with preproliferative retinopathy"
//         },
//         {
//           "icdCode": "E14.35",
//           "icdCodeDescription": "Unspecified diabetes mellitus with advanced ophthalmic disease"
//         },
//         {
//           "icdCode": "E14.34",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other retinopathy"
//         },
//         {
//           "icdCode": "E13.70",
//           "icdCodeDescription": "Other specified diabetes mellitus with multiple complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E14.49",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified neurological complication"
//         },
//         {
//           "icdCode": "E13.71",
//           "icdCodeDescription": "Other specified diabetes mellitus with multiple microvascular complications"
//         },
//         {
//           "icdCode": "E14.40",
//           "icdCodeDescription": "Unspecified diabetes mellitus with unspecified neuropathy"
//         },
//         {
//           "icdCode": "E13.72",
//           "icdCodeDescription": "Other specified diabetes mellitus with features of insulin resistance"
//         },
//         {
//           "icdCode": "E13.73",
//           "icdCodeDescription": "Other specified diabetes mellitus with foot ulcer due to multiple causes"
//         },
//         {
//           "icdCode": "E14.42",
//           "icdCodeDescription": "Unspecified diabetes mellitus with diabetic polyneuropathy"
//         },
//         {
//           "icdCode": "E14.41",
//           "icdCodeDescription": "Unspecified diabetes mellitus with diabetic mononeuropathy"
//         },
//         {
//           "icdCode": "E14.43",
//           "icdCodeDescription": "Unspecified diabetes mellitus with diabetic autonomic neuropathy"
//         },
//         {
//           "icdCode": "E13.80",
//           "icdCodeDescription": "Other specified diabetes mellitus with unspecified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.81",
//           "icdCodeDescription": "Other specified diabetes mellitus with unspecified complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E14.59",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified circulatory complication"
//         },
//         {
//           "icdCode": "H36.0",
//           "icdCodeDescription": "Diabetic retinopathy"
//         },
//         {
//           "icdCode": "E14.51",
//           "icdCodeDescription": "Unspecified diabetes mellitus with peripheral angiopathy without gangrene"
//         },
//         {
//           "icdCode": "E14.50",
//           "icdCodeDescription": "Unspecified diabetes mellitus with circulatory complication, unspecified"
//         },
//         {
//           "icdCode": "E14.53",
//           "icdCodeDescription": "Unspecified diabetes mellitus with diabetic ischaemic cardiomyopathy"
//         },
//         {
//           "icdCode": "E14.52",
//           "icdCodeDescription": "Unspecified diabetes mellitus with peripheral angiopathy with gangrene"
//         },
//         {
//           "icdCode": "E13.90",
//           "icdCodeDescription": "Other specified diabetes mellitus without complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.91",
//           "icdCodeDescription": "Other specified diabetes mellitus without complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E14.60",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E14.69",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "E14.62",
//           "icdCodeDescription": "Unspecified diabetes mellitus with specified skin and subcutaneous tissue complication"
//         },
//         {
//           "icdCode": "E14.61",
//           "icdCodeDescription": "Unspecified diabetes mellitus with specified diabetic musculoskeletal and connective tissue complication"
//         },
//         {
//           "icdCode": "E14.64",
//           "icdCodeDescription": "Unspecified diabetes mellitus with hypoglycaemia"
//         },
//         {
//           "icdCode": "E14.63",
//           "icdCodeDescription": "Unspecified diabetes mellitus with specified periodontal complication"
//         },
//         {
//           "icdCode": "E14.65",
//           "icdCodeDescription": "Unspecified diabetes mellitus with poor control"
//         },
//         {
//           "icdCode": "E14.71",
//           "icdCodeDescription": "Unspecified diabetes mellitus with multiple microvascular complications"
//         },
//         {
//           "icdCode": "E14.70",
//           "icdCodeDescription": "Unspecified diabetes mellitus with multiple complications, not stated as uncontrolled"
//         }
//       ]
//     },
//     {
//       "serviceCode": "7-5518-22",
//       "scientificCode": "7000000346-10-100000073665",
//       "suggestedIcds": [
//         {
//           "icdCode": "E13.29",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified renal complication"
//         },
//         {
//           "icdCode": "E11.81",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with unspecified complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.80",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with unspecified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E12.50",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with peripheral circulatory complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E12.51",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with peripheral circulatory complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.20",
//           "icdCodeDescription": "Other specified diabetes mellitus with renal complication, unspecified"
//         },
//         {
//           "icdCode": "E13.21",
//           "icdCodeDescription": "Other specified diabetes mellitus with incipient diabetic nephropathy"
//         },
//         {
//           "icdCode": "E13.22",
//           "icdCodeDescription": "Other specified diabetes mellitus with established diabetic nephropathy"
//         },
//         {
//           "icdCode": "E13.23",
//           "icdCodeDescription": "Other specified diabetes mellitus with advanced renal disease"
//         },
//         {
//           "icdCode": "N03.1",
//           "icdCodeDescription": "Chronic nephritic syndrome, focal and segmental glomerular lesions"
//         },
//         {
//           "icdCode": "N03.0",
//           "icdCodeDescription": "Chronic nephritic syndrome, minor glomerular abnormality"
//         },
//         {
//           "icdCode": "N03.3",
//           "icdCodeDescription": "Chronic nephritic syndrome, diffuse mesangial proliferative glomerulonephritis"
//         },
//         {
//           "icdCode": "N03.2",
//           "icdCodeDescription": "Chronic nephritic syndrome, diffuse membranous glomerulonephritis"
//         },
//         {
//           "icdCode": "N03.5",
//           "icdCodeDescription": "Chronic nephritic syndrome, diffuse mesangiocapillary glomerulonephritis"
//         },
//         {
//           "icdCode": "N03.4",
//           "icdCodeDescription": "Chronic nephritic syndrome, diffuse endocapillary proliferative glomerulonephritis"
//         },
//         {
//           "icdCode": "E11.90",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus without complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "N03.7",
//           "icdCodeDescription": "Chronic nephritic syndrome, diffuse crescentic glomerulonephritis"
//         },
//         {
//           "icdCode": "N03.6",
//           "icdCodeDescription": "Chronic nephritic syndrome, dense deposit disease"
//         },
//         {
//           "icdCode": "N03.9",
//           "icdCodeDescription": "Chronic nephritic syndrome, unspecified"
//         },
//         {
//           "icdCode": "N03.8",
//           "icdCodeDescription": "Chronic nephritic syndrome, other"
//         },
//         {
//           "icdCode": "E13.35",
//           "icdCodeDescription": "Other specified diabetes mellitus with advanced ophthalmic disease"
//         },
//         {
//           "icdCode": "E13.36",
//           "icdCodeDescription": "Other specified diabetes mellitus with diabetic cataract"
//         },
//         {
//           "icdCode": "E11.1",
//           "icdCodeDescription": "Type 2 diabetes mellitus with acidosis"
//         },
//         {
//           "icdCode": "E13.39",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified ophthalmic complication"
//         },
//         {
//           "icdCode": "E11.0",
//           "icdCodeDescription": "Type 2 diabetes mellitus with hyperosmolarity"
//         },
//         {
//           "icdCode": "G63.2",
//           "icdCodeDescription": "Diabetic polyneuropathy"
//         },
//         {
//           "icdCode": "E11.91",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus without complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.5",
//           "icdCodeDescription": "Type 2 diabetes mellitus with circulatory complciation"
//         },
//         {
//           "icdCode": "E11.4",
//           "icdCodeDescription": "Type 2 diabetes mellitus with neurological complication"
//         },
//         {
//           "icdCode": "E12.60",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with other specified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.3",
//           "icdCodeDescription": "Type 2 diabetes mellitus with ophthalmic complication"
//         },
//         {
//           "icdCode": "E12.61",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with other specified complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "N99.0",
//           "icdCodeDescription": "Postprocedural renal failure"
//         },
//         {
//           "icdCode": "E11.2",
//           "icdCodeDescription": "Type 2 diabetes mellitus with renal complication"
//         },
//         {
//           "icdCode": "E13.30",
//           "icdCodeDescription": "Other specified diabetes mellitus with ophthalmic complication, unspecified"
//         },
//         {
//           "icdCode": "E11.9",
//           "icdCodeDescription": "Type 2 diabetes mellitus without complication"
//         },
//         {
//           "icdCode": "E13.31",
//           "icdCodeDescription": "Other specified diabetes mellitus with background retinopathy"
//         },
//         {
//           "icdCode": "E14.00",
//           "icdCodeDescription": "Unspecified diabetes mellitus with coma, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.8",
//           "icdCodeDescription": "Type 2 diabetes mellitus with unspecified complication"
//         },
//         {
//           "icdCode": "E13.32",
//           "icdCodeDescription": "Other specified diabetes mellitus with preproliferative retinopathy"
//         },
//         {
//           "icdCode": "E11.7",
//           "icdCodeDescription": "Type 2 diabetes mellitus with multiple complications"
//         },
//         {
//           "icdCode": "E13.33",
//           "icdCodeDescription": "Other specified diabetes mellitus with proliferative retinopathy"
//         },
//         {
//           "icdCode": "E14.02",
//           "icdCodeDescription": "Unspecified diabetes mellitus with hyperosmolarity, with coma"
//         },
//         {
//           "icdCode": "E11.6",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "E13.34",
//           "icdCodeDescription": "Other specified diabetes mellitus with other retinopathy"
//         },
//         {
//           "icdCode": "E14.01",
//           "icdCodeDescription": "Unspecified diabetes mellitus with hyperosmolarity, without nonketotic hyperglycaemic-hyperosmolar coma [NKHHC]"
//         },
//         {
//           "icdCode": "I82.8",
//           "icdCodeDescription": "Embolism and thrombosis of other specified veins"
//         },
//         {
//           "icdCode": "E14.15",
//           "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, with lactic acidosis, without coma"
//         },
//         {
//           "icdCode": "E14.14",
//           "icdCodeDescription": "Unspecified diabetes mellitus with lactic acidosis, with coma"
//         },
//         {
//           "icdCode": "E13.49",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified neurological complication"
//         },
//         {
//           "icdCode": "E14.16",
//           "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, with lactic acidosis, with coma"
//         },
//         {
//           "icdCode": "E12.70",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with multiple complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "I12",
//           "icdCodeDescription": "Hypertensive renal disease"
//         },
//         {
//           "icdCode": "E12.71",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with multiple complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.40",
//           "icdCodeDescription": "Other specified diabetes mellitus with unspecified neuropathy"
//         },
//         {
//           "icdCode": "I25.11",
//           "icdCodeDescription": "Atherosclerotic heart disease, of native coronary artery"
//         },
//         {
//           "icdCode": "E13.41",
//           "icdCodeDescription": "Other specified diabetes mellitus with diabetic mononeuropathy"
//         },
//         {
//           "icdCode": "I13",
//           "icdCodeDescription": "Hypertensive heart and renal disease"
//         },
//         {
//           "icdCode": "E13.42",
//           "icdCodeDescription": "Other specified diabetes mellitus with diabetic polyneuropathy"
//         },
//         {
//           "icdCode": "E14.11",
//           "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, without coma"
//         },
//         {
//           "icdCode": "E13.43",
//           "icdCodeDescription": "Other specified diabetes mellitus with diabetic autonomic neuropathy"
//         },
//         {
//           "icdCode": "E14.10",
//           "icdCodeDescription": "Unspecified diabetes mellitus with ketoacidosis, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "G59.0",
//           "icdCodeDescription": "Diabetic mononeuropathy"
//         },
//         {
//           "icdCode": "E14.13",
//           "icdCodeDescription": "Unspecified diabetes mellitus with lactic acidosis, without coma"
//         },
//         {
//           "icdCode": "N04.0",
//           "icdCodeDescription": "Nephrotic syndrome, minor glomerular abnormality"
//         },
//         {
//           "icdCode": "N04.2",
//           "icdCodeDescription": "Nephrotic syndrome, diffuse membranous glomerulonephritis"
//         },
//         {
//           "icdCode": "N04.1",
//           "icdCodeDescription": "Nephrotic syndrome, focal and segmental glomerular lesions"
//         },
//         {
//           "icdCode": "N04.4",
//           "icdCodeDescription": "Nephrotic syndrome, diffuse endocapillary proliferative glomerulonephritis"
//         },
//         {
//           "icdCode": "Z95.1",
//           "icdCodeDescription": "Presence of aortocoronary bypass graft"
//         },
//         {
//           "icdCode": "E12.80",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with unspecified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "N04.3",
//           "icdCodeDescription": "Nephrotic syndrome, diffuse mesangial proliferative glomerulonephritis"
//         },
//         {
//           "icdCode": "N04.6",
//           "icdCodeDescription": "Nephrotic syndrome, dense deposit disease"
//         },
//         {
//           "icdCode": "N04.5",
//           "icdCodeDescription": "Nephrotic syndrome, diffuse mesangiocapillary glomerulonephritis"
//         },
//         {
//           "icdCode": "N04.8",
//           "icdCodeDescription": "Nephrotic syndrome, other"
//         },
//         {
//           "icdCode": "N04.7",
//           "icdCodeDescription": "Nephrotic syndrome, diffuse crescentic glomerulonephritis"
//         },
//         {
//           "icdCode": "N04.9",
//           "icdCodeDescription": "Nephrotic syndrome, unspecified"
//         },
//         {
//           "icdCode": "E13.59",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified circulatory complication"
//         },
//         {
//           "icdCode": "E12.0",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with coma"
//         },
//         {
//           "icdCode": "E14.29",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified renal complication"
//         },
//         {
//           "icdCode": "I21",
//           "icdCodeDescription": "Acute myocardial infarction"
//         },
//         {
//           "icdCode": "I20",
//           "icdCodeDescription": "Angina pectoris"
//         },
//         {
//           "icdCode": "E12.4",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with neurological complications"
//         },
//         {
//           "icdCode": "E12.81",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with unspecified complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E12.3",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with ophthalmic complications"
//         },
//         {
//           "icdCode": "E13.50",
//           "icdCodeDescription": "Other specified diabetes mellitus with circulatory complication, unspecified"
//         },
//         {
//           "icdCode": "E12.2",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with renal complications"
//         },
//         {
//           "icdCode": "E13.51",
//           "icdCodeDescription": "Other specified diabetes mellitus with peripheral angiopathy without gangrene"
//         },
//         {
//           "icdCode": "E14.20",
//           "icdCodeDescription": "Unspecified diabetes mellitus with renal complication, unspecified"
//         },
//         {
//           "icdCode": "E12.1",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with ketoacidosis"
//         },
//         {
//           "icdCode": "E13.52",
//           "icdCodeDescription": "Other specified diabetes mellitus with peripheral angiopathy with gangrene"
//         },
//         {
//           "icdCode": "E12.8",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with unspecified complications"
//         },
//         {
//           "icdCode": "E13.53",
//           "icdCodeDescription": "Other specified diabetes mellitus with diabetic ischaemic cardiomyopathy"
//         },
//         {
//           "icdCode": "E14.22",
//           "icdCodeDescription": "Unspecified diabetes mellitus with established diabetic nephropathy"
//         },
//         {
//           "icdCode": "E12.7",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with multiple complications"
//         },
//         {
//           "icdCode": "E14.21",
//           "icdCodeDescription": "Unspecified diabetes mellitus with incipient diabetic nephropathy"
//         },
//         {
//           "icdCode": "I20.9",
//           "icdCodeDescription": "Angina pectoris, unspecified"
//         },
//         {
//           "icdCode": "E12.6",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with other specified complications"
//         },
//         {
//           "icdCode": "E12.5",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with peripheral circulatory complications"
//         },
//         {
//           "icdCode": "E14.23",
//           "icdCodeDescription": "Unspecified diabetes mellitus with advanced renal disease"
//         },
//         {
//           "icdCode": "E12.9",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus without complications"
//         },
//         {
//           "icdCode": "I20.0",
//           "icdCodeDescription": "Unstable angina"
//         },
//         {
//           "icdCode": "E12.90",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus without complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E12.91",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus without complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "O90.4",
//           "icdCodeDescription": "Postpartum acute renal failure"
//         },
//         {
//           "icdCode": "E11.43",
//           "icdCodeDescription": "Type 2 diabetes mellitus with diabetic autonomic neuropathy"
//         },
//         {
//           "icdCode": "E11.42",
//           "icdCodeDescription": "Type 2 diabetes mellitus with diabetic polyneuropathy"
//         },
//         {
//           "icdCode": "E11.41",
//           "icdCodeDescription": "Type 2 diabetes mellitus with diabetic mononeuropathy"
//         },
//         {
//           "icdCode": "E10.73",
//           "icdCodeDescription": "Type 1 diabetes mellitus with foot ulcer due to multiple causes"
//         },
//         {
//           "icdCode": "E11.40",
//           "icdCodeDescription": "Type 2 diabetes mellitus with unspecified neuropathy"
//         },
//         {
//           "icdCode": "E10.71",
//           "icdCodeDescription": "Type 1 diabetes mellitus with multiple microvascular complications"
//         },
//         {
//           "icdCode": "E10.70",
//           "icdCodeDescription": "Insulin-dependent diabetes mellitus with multiple complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.49",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other specified neurological complication"
//         },
//         {
//           "icdCode": "E09.0",
//           "icdCodeDescription": "Impaired glucose regulation with peripheral angiopathy"
//         },
//         {
//           "icdCode": "P96.0",
//           "icdCodeDescription": "Congenital renal failure"
//         },
//         {
//           "icdCode": "E12.10",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with ketoacidosis, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E12.11",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with ketoacidosis, stated as uncontrolled"
//         },
//         {
//           "icdCode": "N01.1",
//           "icdCodeDescription": "Rapidly progressive nephritic syndrome, focal and segmental glomerular lesions"
//         },
//         {
//           "icdCode": "N01.0",
//           "icdCodeDescription": "Rapidly progressive nephritic syndrome, minor glomerular abnormality"
//         },
//         {
//           "icdCode": "N01.3",
//           "icdCodeDescription": "Rapidly progressive nephritic syndrome, diffuse mesangial proliferative glomerulonephritis"
//         },
//         {
//           "icdCode": "E09.1",
//           "icdCodeDescription": "Impaired glucose regulation with features of insulin resistance"
//         },
//         {
//           "icdCode": "N01.2",
//           "icdCodeDescription": "Rapidly progressive nephritic syndrome, diffuse membranous glomerulonephritis"
//         },
//         {
//           "icdCode": "E09.8",
//           "icdCodeDescription": "Impaired glucose regulation with unspecified complication"
//         },
//         {
//           "icdCode": "N01.5",
//           "icdCodeDescription": "Rapidly progressive nephritic syndrome, diffuse mesangiocapillary glomerulonephritis"
//         },
//         {
//           "icdCode": "N01.4",
//           "icdCodeDescription": "Rapidly progressive nephritic syndrome, diffuse endocapillary proliferative glomerulonephritis"
//         },
//         {
//           "icdCode": "N01.7",
//           "icdCodeDescription": "Rapidly progressive nephritic syndrome, diffuse crescentic glomerulonephritis"
//         },
//         {
//           "icdCode": "N01.6",
//           "icdCodeDescription": "Rapidly progressive nephritic syndrome, dense deposit disease"
//         },
//         {
//           "icdCode": "N01.9",
//           "icdCodeDescription": "Rapidly progressive nephritic syndrome, unspecified"
//         },
//         {
//           "icdCode": "N01.8",
//           "icdCodeDescription": "Rapidly progressive nephritic syndrome, other"
//         },
//         {
//           "icdCode": "E09.9",
//           "icdCodeDescription": "Impaired glucose regulation without complication"
//         },
//         {
//           "icdCode": "E11.53",
//           "icdCodeDescription": "Type 2 diabetes mellitus with diabetic ischaemic cardiomyopathy"
//         },
//         {
//           "icdCode": "E11.52",
//           "icdCodeDescription": "Type 2 diabetes mellitus with peripheral angiopathy with gangrene"
//         },
//         {
//           "icdCode": "E11.51",
//           "icdCodeDescription": "Type 2 diabetes mellitus with peripheral angiopathy without gangrene"
//         },
//         {
//           "icdCode": "E11.50",
//           "icdCodeDescription": "Type 2 diabetes mellitus with circulatory complication, unspecified"
//         },
//         {
//           "icdCode": "E10.81",
//           "icdCodeDescription": "Insulin-dependent diabetes mellitus with unspecified complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E10.80",
//           "icdCodeDescription": "Insulin-dependent diabetes mellitus with unspecified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "I42",
//           "icdCodeDescription": "Cardiomyopathy"
//         },
//         {
//           "icdCode": "E13.3",
//           "icdCodeDescription": "Other specified diabetes mellitus with ophthalmic complication"
//         },
//         {
//           "icdCode": "E13.2",
//           "icdCodeDescription": "Other specified diabetes mellitus with renal complication"
//         },
//         {
//           "icdCode": "E13.1",
//           "icdCodeDescription": "Other specified diabetes mellitus with acidosis"
//         },
//         {
//           "icdCode": "E11.59",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other specified circulatory complication"
//         },
//         {
//           "icdCode": "E13.0",
//           "icdCodeDescription": "Other specified diabetes mellitus with hyperosmolarity"
//         },
//         {
//           "icdCode": "E13.7",
//           "icdCodeDescription": "Other specified diabetes mellitus with multiple complications"
//         },
//         {
//           "icdCode": "E12.20",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with renal complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.6",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "E12.21",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with renal complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.5",
//           "icdCodeDescription": "Other specified diabetes mellitus with circulatory complication"
//         },
//         {
//           "icdCode": "E13.4",
//           "icdCodeDescription": "Other specified diabetes mellitus with neurological complication"
//         },
//         {
//           "icdCode": "E13.9",
//           "icdCodeDescription": "Other specified diabetes mellitus without complication"
//         },
//         {
//           "icdCode": "E13.8",
//           "icdCodeDescription": "Other specified diabetes mellitus with unspecified complication"
//         },
//         {
//           "icdCode": "I42.0",
//           "icdCodeDescription": "Dilated cardiomyopathy"
//         },
//         {
//           "icdCode": "E11.65",
//           "icdCodeDescription": "Type 2 diabetes mellitus with poor control"
//         },
//         {
//           "icdCode": "E13.02",
//           "icdCodeDescription": "Other specified diabetes mellitus with hyperosmolarity, with coma"
//         },
//         {
//           "icdCode": "E11.64",
//           "icdCodeDescription": "Type 2 diabetes mellitus with hypoglycaemia"
//         },
//         {
//           "icdCode": "E11.63",
//           "icdCodeDescription": "Type 2 diabetes mellitus with specified periodontal complication"
//         },
//         {
//           "icdCode": "I50",
//           "icdCodeDescription": "Heart failure"
//         },
//         {
//           "icdCode": "E11.62",
//           "icdCodeDescription": "Type 2 diabetes mellitus with specified skin and subcutaneous tissue complication"
//         },
//         {
//           "icdCode": "E11.61",
//           "icdCodeDescription": "Type 2 diabetes mellitus with specified diabetic musculoskeletal and connective tissue complication"
//         },
//         {
//           "icdCode": "E11.60",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with other specified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E10.91",
//           "icdCodeDescription": "Insulin-dependent diabetes mellitus without complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.69",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "E12.30",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with ophthalmic complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "R73",
//           "icdCodeDescription": "Elevated blood glucose level"
//         },
//         {
//           "icdCode": "E12.31",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with ophthalmic complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.00",
//           "icdCodeDescription": "Other specified diabetes mellitus with coma, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.01",
//           "icdCodeDescription": "Other specified diabetes mellitus with hyperosmolarity, without nonketotic hyperglycaemic-hyperosmolar coma [NKHHC]"
//         },
//         {
//           "icdCode": "N02.2",
//           "icdCodeDescription": "Recurrent and persistent haematuria, diffuse membranous glomerulonephritis"
//         },
//         {
//           "icdCode": "N02.1",
//           "icdCodeDescription": "Recurrent and persistent haematuria, focal and segmental glomerular lesions"
//         },
//         {
//           "icdCode": "N02.4",
//           "icdCodeDescription": "Recurrent and persistent haematuria, diffuse endocapillary proliferative glomerulonephritis"
//         },
//         {
//           "icdCode": "N02.3",
//           "icdCodeDescription": "Recurrent and persistent haematuria, diffuse mesangial proliferative glomerulonephritis"
//         },
//         {
//           "icdCode": "N02.5",
//           "icdCodeDescription": "Recurrent and persistent haematuria, diffuse mesangiocapillary glomerulonephritis"
//         },
//         {
//           "icdCode": "N02.7",
//           "icdCodeDescription": "Recurrent and persistent haematuria, diffuse crescentic glomerulonephritis"
//         },
//         {
//           "icdCode": "E13.13",
//           "icdCodeDescription": "Other specified diabetes mellitus with lactic acidosis, without coma"
//         },
//         {
//           "icdCode": "E13.14",
//           "icdCodeDescription": "Other specified diabetes mellitus with lactic acidosis, with coma"
//         },
//         {
//           "icdCode": "H28.0",
//           "icdCodeDescription": "Diabetic cataract"
//         },
//         {
//           "icdCode": "E13.15",
//           "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, with lactic acidosis, without coma"
//         },
//         {
//           "icdCode": "E11.73",
//           "icdCodeDescription": "Type 2 diabetes mellitus with foot ulcer due to multiple causes"
//         },
//         {
//           "icdCode": "E13.16",
//           "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, with lactic acidosis, with coma"
//         },
//         {
//           "icdCode": "E11.72",
//           "icdCodeDescription": "Type 2 diabetes mellitus with features of insulin resistance"
//         },
//         {
//           "icdCode": "E11.71",
//           "icdCodeDescription": "Type 2 diabetes mellitus with multiple microvascular complications"
//         },
//         {
//           "icdCode": "E11.70",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with multiple complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "I64",
//           "icdCodeDescription": "Stroke, not specified as haemorrhage or infarction"
//         },
//         {
//           "icdCode": "E14.2",
//           "icdCodeDescription": "Unspecified diabetes mellitus with renal complication"
//         },
//         {
//           "icdCode": "E14.1",
//           "icdCodeDescription": "Unspecified diabetes mellitus with acidosis"
//         },
//         {
//           "icdCode": "E14.0",
//           "icdCodeDescription": "Unspecified diabetes mellitus with hyperosmolarity"
//         },
//         {
//           "icdCode": "E12.40",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with neurological complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E12.41",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with neurological complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E14.6",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "E13.10",
//           "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E14.5",
//           "icdCodeDescription": "Unspecified diabetes mellitus with circulatory complication"
//         },
//         {
//           "icdCode": "E13.11",
//           "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, without coma"
//         },
//         {
//           "icdCode": "E14.4",
//           "icdCodeDescription": "Unspecified diabetes mellitus with neurological complication"
//         },
//         {
//           "icdCode": "E13.12",
//           "icdCodeDescription": "Other specified diabetes mellitus with ketoacidosis, with coma"
//         },
//         {
//           "icdCode": "E14.3",
//           "icdCodeDescription": "Unspecified diabetes mellitus with ophthalmic complication"
//         },
//         {
//           "icdCode": "E14.9",
//           "icdCodeDescription": "Unspecified diabetes mellitus without complication"
//         },
//         {
//           "icdCode": "E14.8",
//           "icdCodeDescription": "Unspecified diabetes mellitus with unspecified complication"
//         },
//         {
//           "icdCode": "E14.7",
//           "icdCodeDescription": "Unspecified diabetes mellitus with multiple complications"
//         },
//         {
//           "icdCode": "N08",
//           "icdCodeDescription": "Glomerular disorders in diseases classified elsewhere"
//         },
//         {
//           "icdCode": "E10.31",
//           "icdCodeDescription": "Type 1 diabetes mellitus with background retinopathy"
//         },
//         {
//           "icdCode": "I70",
//           "icdCodeDescription": "Atherosclerosis"
//         },
//         {
//           "icdCode": "E14.73",
//           "icdCodeDescription": "Unspecified diabetes mellitus with foot ulcer due to multiple causes"
//         },
//         {
//           "icdCode": "E14.72",
//           "icdCodeDescription": "Unspecified diabetes mellitus with features of insulin resistance"
//         },
//         {
//           "icdCode": "E11.02",
//           "icdCodeDescription": "Type 2 diabetes mellitus with hyperosmolarity with coma"
//         },
//         {
//           "icdCode": "T86.1",
//           "icdCodeDescription": "Kidney transplant failure and rejection"
//         },
//         {
//           "icdCode": "E11.01",
//           "icdCodeDescription": "Type 2 diabetes mellitus with hyperosmolarity without nonketotic hyperglycaemic-hyperosmolar coma [NKHHC]"
//         },
//         {
//           "icdCode": "E11.00",
//           "icdCodeDescription": "Non-insulin-dependent diabetes mellitus with coma, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "N17",
//           "icdCodeDescription": "Acute renal failure"
//         },
//         {
//           "icdCode": "E14.80",
//           "icdCodeDescription": "Unspecified diabetes mellitus with unspecified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "N19",
//           "icdCodeDescription": "Unspecified renal failure"
//         },
//         {
//           "icdCode": "N18",
//           "icdCodeDescription": "Chronic renal failure"
//         },
//         {
//           "icdCode": "N07.1",
//           "icdCodeDescription": "Hereditary nephropathy, not elsewhere classified, focal and segmental glomerular lesions"
//         },
//         {
//           "icdCode": "E14.81",
//           "icdCodeDescription": "Unspecified diabetes mellitus with unspecified complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "N07.0",
//           "icdCodeDescription": "Hereditary nephropathy, not elsewhere classified, minor glomerular abnormality"
//         },
//         {
//           "icdCode": "N07.3",
//           "icdCodeDescription": "Hereditary nephropathy, not elsewhere classified, diffuse mesangial proliferative glomerulonephritis"
//         },
//         {
//           "icdCode": "N07.2",
//           "icdCodeDescription": "Hereditary nephropathy, not elsewhere classified, diffuse membranous glomerulonephritis"
//         },
//         {
//           "icdCode": "N07.5",
//           "icdCodeDescription": "Hereditary nephropathy, not elsewhere classified, diffuse mesangiocapillary glomerulonephritis"
//         },
//         {
//           "icdCode": "N07.4",
//           "icdCodeDescription": "Hereditary nephropathy, not elsewhere classified, diffuse endocapillary proliferative glomerulonephritis"
//         },
//         {
//           "icdCode": "N07.7",
//           "icdCodeDescription": "Hereditary nephropathy, not elsewhere classified, diffuse crescentic glomerulonephritis"
//         },
//         {
//           "icdCode": "N07.6",
//           "icdCodeDescription": "Hereditary nephropathy, not elsewhere classified, dense deposit disease"
//         },
//         {
//           "icdCode": "N07.9",
//           "icdCodeDescription": "Hereditary nephropathy, not elsewhere classified, unspecified"
//         },
//         {
//           "icdCode": "N07.8",
//           "icdCodeDescription": "Hereditary nephropathy, not elsewhere classified, other"
//         },
//         {
//           "icdCode": "E10.42",
//           "icdCodeDescription": "Type 1 diabetes mellitus with diabetic polyneuropathy"
//         },
//         {
//           "icdCode": "E10.41",
//           "icdCodeDescription": "Type 1 diabetes mellitus with diabetic mononeuropathy"
//         },
//         {
//           "icdCode": "E10.40",
//           "icdCodeDescription": "Type 1 diabetes mellitus with unspecified neuropathy"
//         },
//         {
//           "icdCode": "N18.90",
//           "icdCodeDescription": "Unspecified chronic renal failure"
//         },
//         {
//           "icdCode": "I25.8",
//           "icdCodeDescription": "Other forms of chronic ischaemic heart disease"
//         },
//         {
//           "icdCode": "E11.16",
//           "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, with lactic acidosis, with coma"
//         },
//         {
//           "icdCode": "E11.15",
//           "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, with lactic acidosis, without coma"
//         },
//         {
//           "icdCode": "E11.14",
//           "icdCodeDescription": "Type 2 diabetes mellitus with lactic acidosis, with coma"
//         },
//         {
//           "icdCode": "E09",
//           "icdCodeDescription": "Impaired glucose regulation"
//         },
//         {
//           "icdCode": "E11.13",
//           "icdCodeDescription": "Type 2 diabetes mellitus with lactic acidosis, without coma"
//         },
//         {
//           "icdCode": "E11.12",
//           "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, with coma"
//         },
//         {
//           "icdCode": "I25.5",
//           "icdCodeDescription": "Ischaemic cardiomyopathy"
//         },
//         {
//           "icdCode": "E11.11",
//           "icdCodeDescription": "Type 2 diabetes mellitus with ketoacidosis, without coma"
//         },
//         {
//           "icdCode": "E14.91",
//           "icdCodeDescription": "Unspecified diabetes mellitus without complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E14.90",
//           "icdCodeDescription": "Unspecified diabetes mellitus without complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "N18.91",
//           "icdCodeDescription": "Chronic renal impairment"
//         },
//         {
//           "icdCode": "E11.21",
//           "icdCodeDescription": "Type 2 diabetes mellitus with incipient diabetic nephropathy"
//         },
//         {
//           "icdCode": "E11.20",
//           "icdCodeDescription": "Type 2 diabetes mellitus with renal complication, unspecified"
//         },
//         {
//           "icdCode": "E10",
//           "icdCodeDescription": "Type 1 diabetes mellitus"
//         },
//         {
//           "icdCode": "E12",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus"
//         },
//         {
//           "icdCode": "E11",
//           "icdCodeDescription": "Type 2 diabetes mellitus"
//         },
//         {
//           "icdCode": "E14",
//           "icdCodeDescription": "Unspecified diabetes mellitus"
//         },
//         {
//           "icdCode": "E13",
//           "icdCodeDescription": "Other specified diabetes mellitus"
//         },
//         {
//           "icdCode": "M14.2",
//           "icdCodeDescription": "Diabetic arthropathy"
//         },
//         {
//           "icdCode": "E11.29",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other specified renal complication"
//         },
//         {
//           "icdCode": "E11.23",
//           "icdCodeDescription": "Type 2 diabetes mellitus with advanced renal disease"
//         },
//         {
//           "icdCode": "I13.9",
//           "icdCodeDescription": "Hypertensive heart and renal disease, unspecified"
//         },
//         {
//           "icdCode": "N00.0",
//           "icdCodeDescription": "Acute nephritic syndrome, minor glomerular abnormality"
//         },
//         {
//           "icdCode": "E11.22",
//           "icdCodeDescription": "Type 2 diabetes mellitus with established diabetic nephropathy"
//         },
//         {
//           "icdCode": "N00.2",
//           "icdCodeDescription": "Acute nephritic syndrome, diffuse membranous glomerulonephritis"
//         },
//         {
//           "icdCode": "N00.1",
//           "icdCodeDescription": "Acute nephritic syndrome, focal and segmental glomerular lesions"
//         },
//         {
//           "icdCode": "N00.4",
//           "icdCodeDescription": "Acute nephritic syndrome, diffuse endocapillary proliferative glomerulonephritis"
//         },
//         {
//           "icdCode": "I51.9",
//           "icdCodeDescription": "Heart disease, unspecified"
//         },
//         {
//           "icdCode": "N00.3",
//           "icdCodeDescription": "Acute nephritic syndrome, diffuse mesangial proliferative glomerulonephritis"
//         },
//         {
//           "icdCode": "N00.6",
//           "icdCodeDescription": "Acute nephritic syndrome, dense deposit disease"
//         },
//         {
//           "icdCode": "I13.2",
//           "icdCodeDescription": "Hypertensive heart and renal disease with both (congestive) heart failure and renal failure"
//         },
//         {
//           "icdCode": "N00.5",
//           "icdCodeDescription": "Acute nephritic syndrome, diffuse mesangiocapillary glomerulonephritis"
//         },
//         {
//           "icdCode": "I13.1",
//           "icdCodeDescription": "Hypertensive heart and renal disease with renal failure"
//         },
//         {
//           "icdCode": "N00.8",
//           "icdCodeDescription": "Acute nephritic syndrome, other"
//         },
//         {
//           "icdCode": "N08.0",
//           "icdCodeDescription": "Glomerular disorders in infectious and parasitic diseases classified elsewhere"
//         },
//         {
//           "icdCode": "I13.0",
//           "icdCodeDescription": "Hypertensive heart and renal disease with (congestive) heart failure"
//         },
//         {
//           "icdCode": "N00.7",
//           "icdCodeDescription": "Acute nephritic syndrome, diffuse crescentic glomerulonephritis"
//         },
//         {
//           "icdCode": "N08.2",
//           "icdCodeDescription": "Glomerular disorders in blood diseases and disorders involving the immune mechanism"
//         },
//         {
//           "icdCode": "N00.9",
//           "icdCodeDescription": "Acute nephritic syndrome, unspecified"
//         },
//         {
//           "icdCode": "N08.1",
//           "icdCodeDescription": "Glomerular disorders in neoplastic diseases"
//         },
//         {
//           "icdCode": "N08.4",
//           "icdCodeDescription": "Glomerular disorders in endocrine, nutritional and metabolic diseases"
//         },
//         {
//           "icdCode": "N08.3",
//           "icdCodeDescription": "Glomerular disorders in diabetes mellitus (E10-E14+ with common fourth character .2)"
//         },
//         {
//           "icdCode": "N08.5",
//           "icdCodeDescription": "Glomerular disorders in systemic connective tissue disorders"
//         },
//         {
//           "icdCode": "N08.8",
//           "icdCodeDescription": "Glomerular disorders in other diseases classified elsewhere"
//         },
//         {
//           "icdCode": "E11.32",
//           "icdCodeDescription": "Type 2 diabetes mellitus with preproliferative retinopathy"
//         },
//         {
//           "icdCode": "E10.64",
//           "icdCodeDescription": "Type 1 diabetes mellitus with hypoglycaemia"
//         },
//         {
//           "icdCode": "E11.31",
//           "icdCodeDescription": "Type 2 diabetes mellitus with background retinopathy"
//         },
//         {
//           "icdCode": "E11.30",
//           "icdCodeDescription": "Type 2 diabetes mellitus with ophthalmic complication, unspecified"
//         },
//         {
//           "icdCode": "E10.60",
//           "icdCodeDescription": "Insulin-dependent diabetes mellitus with other specified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E11.39",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other specified ophthalmic complication"
//         },
//         {
//           "icdCode": "I24.9",
//           "icdCodeDescription": "Acute ischaemic heart disease, unspecified"
//         },
//         {
//           "icdCode": "E11.36",
//           "icdCodeDescription": "Type 2 diabetes mellitus with diabetic cataract"
//         },
//         {
//           "icdCode": "E11.35",
//           "icdCodeDescription": "Type 2 diabetes mellitus with advanced ophthalmic disease"
//         },
//         {
//           "icdCode": "E11.34",
//           "icdCodeDescription": "Type 2 diabetes mellitus with other retinopathy"
//         },
//         {
//           "icdCode": "E11.33",
//           "icdCodeDescription": "Type 2 diabetes mellitus with proliferative retinopathy"
//         },
//         {
//           "icdCode": "E12.00",
//           "icdCodeDescription": "Malnutrition-related diabetes mellitus with coma, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E10.65",
//           "icdCodeDescription": "Type 1 diabetes mellitus with poor control"
//         },
//         {
//           "icdCode": "E13.69",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "E14.36",
//           "icdCodeDescription": "Unspecified diabetes mellitus with diabetic cataract"
//         },
//         {
//           "icdCode": "E14.39",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified ophthalmic complication"
//         },
//         {
//           "icdCode": "R73.9",
//           "icdCodeDescription": "Hyperglycaemia, unspecified"
//         },
//         {
//           "icdCode": "E13.60",
//           "icdCodeDescription": "Other specified diabetes mellitus with other specified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.61",
//           "icdCodeDescription": "Other specified diabetes mellitus with specified diabetic musculoskeletal and connective tissue complication"
//         },
//         {
//           "icdCode": "E13.62",
//           "icdCodeDescription": "Other specified diabetes mellitus with specified skin and subcutaneous tissue complication"
//         },
//         {
//           "icdCode": "E14.31",
//           "icdCodeDescription": "Unspecified diabetes mellitus with background retinopathy"
//         },
//         {
//           "icdCode": "E13.63",
//           "icdCodeDescription": "Other specified diabetes mellitus with specified periodontal complication"
//         },
//         {
//           "icdCode": "E14.30",
//           "icdCodeDescription": "Unspecified diabetes mellitus with ophthalmic complication, unspecified"
//         },
//         {
//           "icdCode": "E13.64",
//           "icdCodeDescription": "Other specified diabetes mellitus with hypoglycaemia"
//         },
//         {
//           "icdCode": "E14.33",
//           "icdCodeDescription": "Unspecified diabetes mellitus with proliferative retinopathy"
//         },
//         {
//           "icdCode": "E13.65",
//           "icdCodeDescription": "Other specified diabetes mellitus with poor control"
//         },
//         {
//           "icdCode": "E14.32",
//           "icdCodeDescription": "Unspecified diabetes mellitus with preproliferative retinopathy"
//         },
//         {
//           "icdCode": "E14.35",
//           "icdCodeDescription": "Unspecified diabetes mellitus with advanced ophthalmic disease"
//         },
//         {
//           "icdCode": "E14.34",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other retinopathy"
//         },
//         {
//           "icdCode": "I12.9",
//           "icdCodeDescription": "Hypertensive renal disease without renal failure"
//         },
//         {
//           "icdCode": "I12.0",
//           "icdCodeDescription": "Hypertensive renal disease with renal failure"
//         },
//         {
//           "icdCode": "I50.9",
//           "icdCodeDescription": "Heart failure, unspecified"
//         },
//         {
//           "icdCode": "N05.1",
//           "icdCodeDescription": "Unspecified nephritic syndrome, focal and segmental glomerular lesions"
//         },
//         {
//           "icdCode": "N05.0",
//           "icdCodeDescription": "Unspecified nephritic syndrome, minor glomerular abnormality"
//         },
//         {
//           "icdCode": "N05.3",
//           "icdCodeDescription": "Unspecified nephritic syndrome, diffuse mesangial proliferative glomerulonephritis"
//         },
//         {
//           "icdCode": "E13.70",
//           "icdCodeDescription": "Other specified diabetes mellitus with multiple complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "N05.2",
//           "icdCodeDescription": "Unspecified nephritic syndrome, diffuse membranous glomerulonephritis"
//         },
//         {
//           "icdCode": "N05.5",
//           "icdCodeDescription": "Unspecified nephritic syndrome, diffuse mesangiocapillary glomerulonephritis"
//         },
//         {
//           "icdCode": "I50.0",
//           "icdCodeDescription": "Congestive heart failure"
//         },
//         {
//           "icdCode": "N05.4",
//           "icdCodeDescription": "Unspecified nephritic syndrome, diffuse endocapillary proliferative glomerulonephritis"
//         },
//         {
//           "icdCode": "N05.7",
//           "icdCodeDescription": "Unspecified nephritic syndrome, diffuse crescentic glomerulonephritis"
//         },
//         {
//           "icdCode": "N05.6",
//           "icdCodeDescription": "Unspecified nephritic syndrome, dense deposit disease"
//         },
//         {
//           "icdCode": "I50.1",
//           "icdCodeDescription": "Left ventricular failure"
//         },
//         {
//           "icdCode": "N05.9",
//           "icdCodeDescription": "Unspecified nephritic syndrome, unspecified"
//         },
//         {
//           "icdCode": "N05.8",
//           "icdCodeDescription": "Unspecified nephritic syndrome, other"
//         },
//         {
//           "icdCode": "E14.49",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified neurological complication"
//         },
//         {
//           "icdCode": "E13.71",
//           "icdCodeDescription": "Other specified diabetes mellitus with multiple microvascular complications"
//         },
//         {
//           "icdCode": "E14.40",
//           "icdCodeDescription": "Unspecified diabetes mellitus with unspecified neuropathy"
//         },
//         {
//           "icdCode": "E13.72",
//           "icdCodeDescription": "Other specified diabetes mellitus with features of insulin resistance"
//         },
//         {
//           "icdCode": "E13.73",
//           "icdCodeDescription": "Other specified diabetes mellitus with foot ulcer due to multiple causes"
//         },
//         {
//           "icdCode": "E14.42",
//           "icdCodeDescription": "Unspecified diabetes mellitus with diabetic polyneuropathy"
//         },
//         {
//           "icdCode": "E14.41",
//           "icdCodeDescription": "Unspecified diabetes mellitus with diabetic mononeuropathy"
//         },
//         {
//           "icdCode": "E14.43",
//           "icdCodeDescription": "Unspecified diabetes mellitus with diabetic autonomic neuropathy"
//         },
//         {
//           "icdCode": "I69.4",
//           "icdCodeDescription": "Sequelae of stroke, not specified as haemorrhage or infarction"
//         },
//         {
//           "icdCode": "N17.1",
//           "icdCodeDescription": "Acute renal failure with acute cortical necrosis"
//         },
//         {
//           "icdCode": "N17.2",
//           "icdCodeDescription": "Acute renal failure with medullary necrosis"
//         },
//         {
//           "icdCode": "E13.80",
//           "icdCodeDescription": "Other specified diabetes mellitus with unspecified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.81",
//           "icdCodeDescription": "Other specified diabetes mellitus with unspecified complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "N17.0",
//           "icdCodeDescription": "Acute renal failure with tubular necrosis"
//         },
//         {
//           "icdCode": "N17.9",
//           "icdCodeDescription": "Acute renal failure, unspecified"
//         },
//         {
//           "icdCode": "N17.8",
//           "icdCodeDescription": "Other acute renal failure"
//         },
//         {
//           "icdCode": "E14.59",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified circulatory complication"
//         },
//         {
//           "icdCode": "H36.0",
//           "icdCodeDescription": "Diabetic retinopathy"
//         },
//         {
//           "icdCode": "E14.51",
//           "icdCodeDescription": "Unspecified diabetes mellitus with peripheral angiopathy without gangrene"
//         },
//         {
//           "icdCode": "E14.50",
//           "icdCodeDescription": "Unspecified diabetes mellitus with circulatory complication, unspecified"
//         },
//         {
//           "icdCode": "E14.53",
//           "icdCodeDescription": "Unspecified diabetes mellitus with diabetic ischaemic cardiomyopathy"
//         },
//         {
//           "icdCode": "E14.52",
//           "icdCodeDescription": "Unspecified diabetes mellitus with peripheral angiopathy with gangrene"
//         },
//         {
//           "icdCode": "E13.90",
//           "icdCodeDescription": "Other specified diabetes mellitus without complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "E13.91",
//           "icdCodeDescription": "Other specified diabetes mellitus without complications, stated as uncontrolled"
//         },
//         {
//           "icdCode": "E14.60",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "N06.6",
//           "icdCodeDescription": "Isolated proteinuria with dense deposit disease"
//         },
//         {
//           "icdCode": "E10.20",
//           "icdCodeDescription": "Type 1 diabetes mellitus with renal complication, unspecified"
//         },
//         {
//           "icdCode": "E14.69",
//           "icdCodeDescription": "Unspecified diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "R07.4",
//           "icdCodeDescription": "Chest pain, unspecified"
//         },
//         {
//           "icdCode": "E10.1",
//           "icdCodeDescription": "Type 1 diabetes mellitus with acidosis"
//         },
//         {
//           "icdCode": "R07.3",
//           "icdCodeDescription": "Other chest pain"
//         },
//         {
//           "icdCode": "E14.62",
//           "icdCodeDescription": "Unspecified diabetes mellitus with specified skin and subcutaneous tissue complication"
//         },
//         {
//           "icdCode": "E10.6",
//           "icdCodeDescription": "Type 1 diabetes mellitus with other specified complication"
//         },
//         {
//           "icdCode": "E14.61",
//           "icdCodeDescription": "Unspecified diabetes mellitus with specified diabetic musculoskeletal and connective tissue complication"
//         },
//         {
//           "icdCode": "E14.64",
//           "icdCodeDescription": "Unspecified diabetes mellitus with hypoglycaemia"
//         },
//         {
//           "icdCode": "E10.4",
//           "icdCodeDescription": "Type 1 diabetes mellitus with neurological complication"
//         },
//         {
//           "icdCode": "E14.63",
//           "icdCodeDescription": "Unspecified diabetes mellitus with specified periodontal complication"
//         },
//         {
//           "icdCode": "E14.65",
//           "icdCodeDescription": "Unspecified diabetes mellitus with poor control"
//         },
//         {
//           "icdCode": "E10.9",
//           "icdCodeDescription": "Insulin-dependent diabetes mellitus without complications"
//         },
//         {
//           "icdCode": "K76.9",
//           "icdCodeDescription": "Liver disease, unspecified"
//         },
//         {
//           "icdCode": "E10.8",
//           "icdCodeDescription": "Type 1 diabetes mellitus with unspecified complication"
//         },
//         {
//           "icdCode": "E10.7",
//           "icdCodeDescription": "Type 1 diabetes mellitus with multiple complications"
//         },
//         {
//           "icdCode": "K76.0",
//           "icdCodeDescription": "Fatty (change of) liver, not elsewhere classified"
//         },
//         {
//           "icdCode": "N18.0",
//           "icdCodeDescription": "End-stage renal disease"
//         },
//         {
//           "icdCode": "E14.71",
//           "icdCodeDescription": "Unspecified diabetes mellitus with multiple microvascular complications"
//         },
//         {
//           "icdCode": "E14.70",
//           "icdCodeDescription": "Unspecified diabetes mellitus with multiple complications, not stated as uncontrolled"
//         },
//         {
//           "icdCode": "N18.8",
//           "icdCodeDescription": "Other chronic renal failure"
//         },
//         {
//           "icdCode": "N18.9",
//           "icdCodeDescription": "Chronic renal failure, unspecified"
//         }
//       ]
//     }
//   ]
// }
