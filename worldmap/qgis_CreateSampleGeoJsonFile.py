import os
from qgis.PyQt.QtWidgets import QFileDialog, QMessageBox
from qgis.core import (
    QgsProject,
    QgsVectorLayer,
    QgsVectorFileWriter,
    QgsCoordinateReferenceSystem,
    QgsCoordinateTransform,
)
from qgis.utils import iface


def export_selected_to_geojson():
    layer = iface.activeLayer()
    if not isinstance(layer, QgsVectorLayer):
        QMessageBox.warning(None, 'No Vector Layer', 'Please select a vector line layer first.')
        return

    sel_count = layer.selectedFeatureCount()
    if sel_count == 0:
        QMessageBox.warning(None, 'No Selection', f'No features are selected in "{layer.name()}".')
        return

    default_path = os.path.join(os.path.expanduser('~'), f'{layer.name()}_selected.geojson')
    out_path, _ = QFileDialog.getSaveFileName(
        iface.mainWindow(),
        'Export Selected Features to GeoJSON',
        default_path,
        'GeoJSON (*.geojson *.json)',
    )
    if not out_path:
        return
    if not out_path.lower().endswith(('.geojson', '.json')):
        out_path += '.geojson'

    options = QgsVectorFileWriter.SaveVectorOptions()
    options.driverName = 'GeoJSON'
    options.fileEncoding = 'UTF-8'
    options.onlySelectedFeatures = True
    options.layerOptions = ['COORDINATE_PRECISION=6']

    # Reproject to WGS84 (EPSG:4326) for GeoJSON / MapLibre compatibility
    target_crs = QgsCoordinateReferenceSystem('EPSG:4326')
    if layer.crs() != target_crs:
        options.ct = QgsCoordinateTransform(layer.crs(), target_crs, QgsProject.instance())

    err, err_msg, _, _ = QgsVectorFileWriter.writeAsVectorFormatV3(
        layer,
        out_path,
        QgsProject.instance().transformContext(),
        options,
    )

    if err != QgsVectorFileWriter.NoError:
        QMessageBox.critical(None, 'Export Failed', f'Error exporting GeoJSON:\n{err_msg}')
    else:
        size_kb = os.path.getsize(out_path) / 1024.0
        print(f'Exported {sel_count:,} selected features -> {out_path} ({size_kb:,.1f} KB)')
        QMessageBox.information(
            None,
            'Export Complete',
            f'Exported {sel_count:,} features to:\n{out_path}\n({size_kb:,.1f} KB)',
        )


export_selected_to_geojson()