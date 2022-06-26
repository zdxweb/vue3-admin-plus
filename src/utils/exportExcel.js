import * as xlsx from 'xlsx'
const { utils, writeFile } = xlsx;
const DEF_FILE_NAME = 'new-excel.xlsx';
// export function jsonToSheetXlsx({ data, header, filename = DEF_FILE_NAME, json2sheetOpts = {}, write2excelOpts = { bookType: 'xlsx' }, }) {
//     const arrData = [...data];
//     if (header) {
//         arrData.unshift(header);
//         json2sheetOpts.skipHeader = true;
//     }
//     const worksheet = utils.json_to_sheet(arrData, json2sheetOpts);
//     /* add worksheet to workbook */
//     const workbook = {
//         SheetNames: [filename],
//         Sheets: {
//             [filename]: worksheet,
//         },
//     };
//     /* output format determined by filename */
//     writeFile(workbook, filename, write2excelOpts);
//     /* at this point, out.xlsb will have been downloaded */
// }
export  function aoaToSheetXlsx({ data, header, filename = DEF_FILE_NAME, write2excelOpts = { bookType: 'xlsx' }, }) {
    const arrData = [...data];
    if (header) {
        arrData.unshift(header);
    }
    const worksheet = utils.aoa_to_sheet(arrData);
    /* add worksheet to workbook */
    const workbook = {
        SheetNames: [filename],
        Sheets: {
            [filename]: worksheet,
        },
    };
    /* output format determined by filename */
    writeFile(workbook, filename, write2excelOpts);
    /* at this point, out.xlsb will have been downloaded */
}