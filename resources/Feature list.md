# Obsidian Extensions

These are our extensions to obsidian provided classes and systems.

### CSV View

- A new registered view that allows for csv editing. Saving and loading is handled natively.

### Commands

- Save default data - dumps all the internal data to the export path.
- Insert Frontmatter Template - writes one of the internal yaml templates to a given md file's frontmatter.
- Process and save map data - Runs the processing on psd files then saves the results.

### Post Processors

- Embedded CSV
  - Give a file path to the desired csv and insert it into the rendered page.
- Generated Stats
  - Generate a country's stats from the frontmatter and map data.

# New Features

### PSD File Processing

A system to automatically calculate useful information from maps made in photoshop.

- MapConfig.csv is required for full processing.
  - Specifies the dimensions of the map and its geometry.
- Find the intersection with the base layer and political layers to calculate land area of political entities.
- Future Plans
  - Road networks - maybe represent as a graph and then we can traverse and calculate travel time and distance.
  - Locations of settlements.

### CSV View

A viewer/editor for csv files based on handsontable.

- Saves/Reads files via system hooks.
- Button to toggle header states
  - Should default to the plugin setting value, but persist between different pages.
- Loading bar
  - Shown during data load.
- Error message when file could not be loaded.
- Embedable - we can add the component to normal pages using the post processor.
