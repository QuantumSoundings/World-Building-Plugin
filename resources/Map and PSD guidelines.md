# PSD File Structure

Guideline for structuring map files in psd.

- Root
  - 'Topography' - Group
    - 'Base' - Layer - Black where land is present, fully transparency otherwise.
  - 'Political' - Group
    - 'Political Entity Name' - Layer - Represents the area of influence, quasi-borders, of the political entity. Any color for the area of influence, fully transparency otherwise.
    - ... One for each political entity.
  - 'Climate' - Group
    - 'Climate Type' - Layer - Represents the climate at the given location. Consider using Koppen climate classification system. One climate per layer.
    - 'Biome Type' - Layer - Represents the biome at a given location.
  - 'Geographic Features' - Group
    - 'Rivers' - Layer - All the rivers for the map.
  - 'Misc' - Group - Any other layers used during the creation of the map.
