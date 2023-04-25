"""
function to convert .nc format of geojson data format (data must be related to coordinates)
variables should start with lat and lon
rest variables can be anything
expecting masked arrays from .nc files
it shld be able to handle different resolution of data(need to check tho)
"""
import json
from netCDF4 import Dataset
import numpy as np
import sys
fh = Dataset("./data/ww3_fcs_glo_1.0.nc")
ele = Dataset("./data/Bathymetry.nc")


li=list(fh.variables.keys())
li=li[2:]#as lon , lat are not keys

step_y = (float(fh.variables['lon'][-1].data)-float(fh.variables['lon'][0].data)+1)/fh.variables['lon'].shape[0]
step_x = (float(fh.variables['lat'][-1].data)-float(fh.variables['lat'][0].data)+1)/fh.variables['lat'].shape[0]

dict={}
dict["features"]=[]
dict["type"]="FeatureCollection"

variable_arrays={key:np.ma.filled(fh.variables[key]) for key in li}

for i in np.arange(float(fh.variables['lat'][0].data),float(fh.variables['lat'][-1].data+step_x),step_x):
    for j in np.arange(float(fh.variables['lon'][0].data),float(fh.variables['lon'][-1].data+step_y),step_y):
        coord={}
        coord["type"]="Feature"
        coord["geometry"]={}
        coord["geometry"]["type"]="Point"
        coord["geometry"]["coordinates"]=[j,i]#lon,lat
        coord["properties"]={}
        for k in li:
            if k=="time":
                coord["properties"][k]=float(variable_arrays[k][0])#only one time point as of now
            else:
                coord["properties"][k]=float(variable_arrays[k][0][70+int(i)][int(j)])
        coord["properties"]["elevation"]=float(ele.variables['elevation'][90+int(i)][int(j)])
        if (not(variable_arrays[k][0][70+int(i)][int(j)]<0)):
            dict["features"].append(coord)

import json
# Serializing json
json_object = json.dumps(dict, indent=4)
outfile = open('sample.json', 'w')
outfile.writelines(json_object)
outfile.close()
