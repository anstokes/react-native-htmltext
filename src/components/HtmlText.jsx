/* eslint { react/jsx-props-no-spreading: 0, react/forbid-prop-types: 0 } */
import React from 'react';
import PropTypes from 'prop-types';

import * as WebBrowser from 'expo-web-browser';
import { Text, View } from 'react-native';

import defaultStyles from '../styles';

function HtmlText(props) {
  // Read values from props
  const {
    boldStyle,
    emphasisStyle,
    hyperlinkStyle,
    italicStyle,
    onPress,
    newLineStyle,
    paragraphElementType,
    paragraphStyle,
    style,
    textElementType,
    children,
    nested,
  } = props;

  // Define elements
  const elements = [];
  const ParagraphElement = paragraphElementType;
  const TextElement = textElementType;

  const keyPrefix = 'HtmlText';

  const createTextElement = (key, textStyle, textPress, textString) => (
    <TextElement
      key={key}
      style={textStyle}
      onPress={textPress}
    >
      {textString}
    </TextElement>
  );

  let htmlString = children;
  let linkPress = onPress;

  // Remove new lines (e.g. \r\n, \n, \r)
  htmlString = htmlString.replace(/(\r\n|\n|\r)/gm, '');

  // HTML tags regular expression
  const htmlRegex = /<(b|strong|em|i|p)>(.*?)<\/\1>|<\/?\s?br\s?\/?>|<a.*?>(.*)<\/a>/;
  const matches = htmlString.match(htmlRegex);
  if (matches && matches.length) {
    // Regular expressions for various HTML tags
    const hyperlinkRegex = /^<a href=('|")(\S*?)(?:\1).*?>(.*?)<\/a>/;
    const boldRegex = /^<(b|strong)>(.*?)<\/\1>/;
    const emphasisRegex = /^<em>(.*?)<\/em>/;
    const italicRegex = /^<i>(.*?)<\/i>/;
    const paragraphRegex = /^<p>(.*?)<\/p>/;
    const newLineRegex = /^<\/?\s?br\s?\/?>/;

    // Convert match into an array of replacement components
    // Use 'tag' where possible to avoid regex tests (slower on mobiles)
    const match = matches[0];
    const tag = matches[1]?.toLowerCase() ?? '';

    // Add any text BEFORE the HTML tag; MUST be text or it would have matched an earlier tag
    const firstCharacter = htmlString.indexOf(match);
    if (firstCharacter > 1) {
      // Has text BEFORE the HTML tag
      const initialString = htmlString.substring(0, firstCharacter);
      // console.log('Text BEFORE tag: ', initialString);
      elements.push(
        createTextElement(`initial:${keyPrefix}`, style, linkPress, initialString),
      );
    }

    // Parse the text within the match
    const innerHtml = htmlString.substring(firstCharacter, (match.length + firstCharacter));
    if (innerHtml) {
      // console.log('Text WITHIN tag: ', innerHtml);
      let nestedHtml = '';
      const nestedStyle = [style];

      // Check if hyperlink
      if (hyperlinkRegex.test(innerHtml)) {
        // 2 = href, 3 = inner HTML
        const hyperlinkParts = match.match(hyperlinkRegex);
        // console.log('New hyperlink:', hyperlinkParts[2], hyperlinkParts[3]);
        [,,, nestedHtml] = hyperlinkParts;
        nestedStyle.push(hyperlinkStyle);
        linkPress = () => { WebBrowser.openBrowserAsync(hyperlinkParts[2]); };
      }

      // Check if bold
      // if (boldRegex.test(match)) {
      if ((tag === 'b' || tag === 'strong')) {
        // 2nd match element; 1st is either 'b' or 'strong'
        nestedHtml = match.replace(boldRegex, '$2');
        nestedStyle.push(boldStyle);
      }

      // Check if emphasis
      // if (emphasisRegex.test(match)) {
      if (tag === 'em') {
        nestedHtml = match.replace(emphasisRegex, '$1');
        nestedStyle.push(emphasisStyle);
      }

      // Check if italic
      // if (italicRegex.test(match)) {
      if (tag === 'i') {
        nestedHtml = match.replace(italicRegex, '$1');
        nestedStyle.push(italicStyle);
      }

      // Check if paragraph
      // if (paragraphRegex.test(match)) {
      if (tag === 'p') {
        nestedHtml = match.replace(paragraphRegex, '$1');
        elements.push(
          React.createElement(ParagraphElement, {
            key: `newparagraph:${keyPrefix}`,
            style: paragraphStyle,
          }),
        );
        // nestedStyle.push(paragraphStyle);
      }

      // Check if newline
      if (newLineRegex.test(match)) {
        // console.log('New line');
        elements.push(
          createTextElement(`newline:${keyPrefix}`, newLineStyle, null, '\n'),
        );
      }

      if (nestedHtml) {
        // console.log(nestedHtml, nestedStyle);
        elements.push(
          <HtmlText
            key={`nested:${keyPrefix}`}
            {...props}
            style={nestedStyle}
            onPress={linkPress}
            nested
          >
            {nestedHtml}
          </HtmlText>,
        );
      }
    }

    // Add any text AFTER the HTML tag
    const lastCharacter = firstCharacter + match.length;
    const remainingString = htmlString.substring(lastCharacter);
    if (remainingString) {
      // Has text AFTER the HTML tag
      // console.log('Text AFTER tag: ', remainingString);
      elements.push(
        <HtmlText
          key={`remaining:${keyPrefix}`}
          {...props}
        >
          {remainingString}
        </HtmlText>,
      );
    }
  } else {
    // No HTML to parse, just plain text
    // console.log('No HTML, text only: ', htmlString);
    elements.push(
      createTextElement(`plainText:${keyPrefix}:noHtml`, style, linkPress, htmlString),
    );
  }

  // console.log(elements);
  if (nested) {
    return (<TextElement>{elements}</TextElement>);
  }

  return elements;
}

HtmlText.propTypes = {
  boldElement: PropTypes.node,
  boldStyle: PropTypes.node,
  emphasisElement: PropTypes.node,
  emphasisStyle: PropTypes.node,
  hyperlinkElement: PropTypes.node,
  hyperlinkStyle: PropTypes.node,
  italicElement: PropTypes.node,
  italicStyle: PropTypes.node,
  onPress: PropTypes.func,
  newLineElement: PropTypes.node,
  newLineStyle: PropTypes.node,
  paragraphElementType: PropTypes.object,
  paragraphStyle: PropTypes.node,
  style: PropTypes.node,
  textElementType: PropTypes.object,
  children: PropTypes.string.isRequired,
  nested: PropTypes.bool,
};

HtmlText.defaultProps = {
  boldElement: null,
  boldStyle: defaultStyles.bold,
  emphasisElement: null,
  emphasisStyle: defaultStyles.emphasis,
  hyperlinkElement: null,
  hyperlinkStyle: defaultStyles.hyperlink,
  italicElement: null,
  italicStyle: defaultStyles.italic,
  onPress: null,
  newLineElement: null,
  newLineStyle: defaultStyles.newLine,
  paragraphElementType: View,
  paragraphStyle: defaultStyles.paragraph,
  style: defaultStyles.style,
  textElementType: Text,
  nested: false,
};

export default HtmlText;
