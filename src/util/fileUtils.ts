export class FileUtils {
  // Verify the string is formatted as "[[link]]" or "[[link#heading]]",
  // the return the link without brackets.
  public static parseBracketLink(link: string): string {
    if (link.startsWith("[[") && link.endsWith("]]")) {
      return link.slice(2, -2);
    }
    return link;
  }
}
