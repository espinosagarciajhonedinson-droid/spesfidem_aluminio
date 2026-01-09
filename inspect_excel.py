try:
    import openpyxl
    wb = openpyxl.load_workbook('assets/documents/tabla_descuentos.xlsx', data_only=True)
    sheet = wb.active
    print(f"Sheet: {sheet.title}")
    for row in sheet.iter_rows(max_row=30, values_only=True):
        print(row)
except Exception as e:
    print(f"Error: {e}")
