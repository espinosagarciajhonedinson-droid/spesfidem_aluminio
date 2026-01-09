import zipfile
import xml.etree.ElementTree as ET
import os

EXCEL_PATH = 'assets/documents/tabla_descuentos.xlsx'

def get_shared_strings(z):
    strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        with z.open('xl/sharedStrings.xml') as f:
            tree = ET.parse(f)
            root = tree.getroot()
            # xmlns usually http://schemas.openxmlformats.org/spreadsheetml/2006/main
            ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            for si in root.findall('ns:si', ns):
                t = si.find('ns:t', ns)
                if t is not None and t.text:
                    strings.append(t.text)
                else:
                    # check for runs
                    text = ""
                    for r in si.findall('ns:r', ns):
                        rt = r.find('ns:t', ns)
                        if rt is not None and rt.text:
                            text += rt.text
                    strings.append(text)
    return strings

def parse_sheet(z, filename, strings):
    rows_data = {}
    with z.open(filename) as f:
        tree = ET.parse(f)
        root = tree.getroot()
        ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        sheetData = root.find('ns:sheetData', ns)
        if sheetData is None: return {}
        
        for row in sheetData.findall('ns:row', ns):
            rIdx = int(row.attrib['r'])
            if rIdx > 20: continue # Only first 20 rows
            
            row_cells = {}
            for c in row.findall('ns:c', ns):
                coord = c.attrib['r']
                # parse column
                col_alpha = "".join([x for x in coord if x.isalpha()])
                # Simple mapping A=0, B=1...
                col_idx = 0
                for char in col_alpha:
                    col_idx = col_idx * 26 + (ord(char) - ord('A') + 1)
                col_idx -= 1
                
                t = c.attrib.get('t', 'n')
                val = ""
                v_node = c.find('ns:v', ns)
                if v_node is not None and v_node.text:
                    if t == 's':
                        val = strings[int(v_node.text)]
                    else:
                        val = v_node.text
                
                row_cells[col_idx] = val
            rows_data[rIdx] = row_cells
    return rows_data

def main():
    if not os.path.exists(EXCEL_PATH):
        print("Excel file not found!")
        return

    with zipfile.ZipFile(EXCEL_PATH, 'r') as z:
        strings = get_shared_strings(z)
        
        # Get sheet mapping
        with z.open('xl/workbook.xml') as f:
            tree = ET.parse(f)
            ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            sheets = []
            for s in tree.find('ns:sheets', ns).findall('ns:sheet', ns):
                sheets.append({
                    'name': s.attrib['name'],
                    'id': s.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'),
                    'sheetId': s.attrib.get('sheetId')
                })
        
        # Get rels to find file paths
        wb_rels = {}
        with z.open('xl/_rels/workbook.xml.rels') as f:
            tree = ET.parse(f)
            ns = {'ns': 'http://schemas.openxmlformats.org/package/2006/relationships'}
            for rel in tree.findall('ns:Relationship', ns):
                wb_rels[rel.attrib['Id']] = rel.attrib['Target']
                
        print(f"Total Sheets: {len(sheets)}")
        
        for s in sheets:
            target = wb_rels.get(s['id'])
            path = f"xl/{target}"
            print(f"\n--- SHEET: {s['name']} (Path: {path}) ---")
            
            data = parse_sheet(z, path, strings)
            
            for r in range(1, 16):
                row_str = f"Row {r}: "
                if r in data:
                    row_vals = []
                    for c in range(8): # A to H
                        val = data[r].get(c, "[ ]")
                        row_vals.append(f"{val:>15}")
                    row_str += " | ".join(row_vals)
                else:
                    row_str += " (Empty)"
                print(row_str)

if __name__ == "__main__":
    main()
