import google.generativeai as genai
import os
import json
import re
from datetime import datetime
from dotenv import load_dotenv
import traceback
import time

load_dotenv()

class GeminiCourseGenerator:
    def __init__(self):
        try:
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                raise ValueError("GEMINI_API_KEY not found in environment variables")
            
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-2.5-pro')
            print("✅ Gemini AI initialized successfully")
        except Exception as e:
            print(f"❌ Gemini AI initialization failed: {e}")
            self.model = None
    
    def generate_course(self, content, settings, db_manager=None, content_id=None):
        """Generate course with SMART CONTENT DISTRIBUTION and CLEAN NOTES"""
        if not self.model:
            return {"success": False, "error": "Gemini AI not initialized"}
        
        try:
            print("🚀 Starting SMART course generation...")
            print(f"📊 Content length: {len(content)} characters")
            print(f"🎯 Modules requested: {settings.get('modules', 4)}")
            print(f"❓ Questions per module: {settings.get('questions_per_module', 3)}")
            print(f"🃏 Flashcards requested: {settings.get('flashcards', 15)}")
            
            total_modules = settings.get('modules', 4)
            questions_per_module = settings.get('questions_per_module', 3)
            
            # SMART BATCHING: More than 5 modules = use batching
            if total_modules > 5:
                batches = self._calculate_optimal_batches(total_modules)
                print(f"🔄 Using {batches} batches for {total_modules} modules")
                return self._generate_smart_batched_course(content, settings, db_manager, content_id, batches)
            else:
                print("🔄 Single batch generation for optimal quality")
                return self._generate_single_course_optimized(content, settings, questions_per_module)
            
        except Exception as e:
            print(f"❌ Course generation error: {e}")
            traceback.print_exc()
            return {"success": False, "error": str(e)}
    
    def _calculate_optimal_batches(self, total_modules):
        """Calculate optimal number of batches based on module count"""
        if total_modules <= 5:
            return 1
        elif total_modules <= 8:
            return 2
        elif total_modules <= 12:
            return 3
        else:
            return 4
    
    def _generate_single_course_optimized(self, content, settings, questions_per_module=3):
        """Single request generation with FULL CONTENT UTILIZATION"""
        prompt = self._create_optimized_prompt(content, settings, questions_per_module)
        
        start_time = time.time()
        response = self._generate_with_retry(prompt, max_retries=2, max_tokens=32768)
        if not response:
            return {"success": False, "error": "Generation failed after retries"}
        
        generation_time = time.time() - start_time
        print(f"⏱️  Single generation completed in {generation_time:.2f} seconds")
        
        if not response.text:
            return {"success": False, "error": "Empty response from AI"}
        
        # Parse and clean the response
        course_data = self._parse_and_clean_course_response(response.text, settings)
        
        return {
            "success": True,
            "course_data": course_data,
            "source": "gemini_optimized_single",
            "settings_used": settings,
            "generation_time": generation_time,
            "batched": False
        }
    
    def _generate_smart_batched_course(self, content, settings, db_manager=None, content_id=None, total_batches=2):
        """Smart batched generation with balanced module distribution"""
        total_modules = settings.get('modules', 4)
        questions_per_module = settings.get('questions_per_module', 3)
        
        # Calculate modules per batch (balanced distribution)
        modules_per_batch = self._calculate_modules_per_batch(total_modules, total_batches)
        print(f"📦 Module distribution: {modules_per_batch}")
        
        partial_available = False
        all_partials = []
        batch_times = []
        
        # Process each batch
        for batch_num in range(1, total_batches + 1):
            batch_modules = modules_per_batch[batch_num - 1]
            print(f"🔄 Processing batch {batch_num}/{total_batches} with {batch_modules} modules")
            
            # Smart content segmentation for each batch
            batch_content = self._get_content_segment(content, batch_num, total_batches, total_modules)
            
            batch_settings = settings.copy()
            batch_settings['modules'] = batch_modules
            
            # First batch gets metadata, last batch gets flashcards
            if batch_num == 1:
                batch_settings['include_metadata'] = True
                batch_settings['flashcards'] = 0
            elif batch_num == total_batches:
                batch_settings['include_metadata'] = False
                batch_settings['flashcards'] = settings.get('flashcards', 15)
            else:
                batch_settings['include_metadata'] = False
                batch_settings['flashcards'] = 0
            
            prompt = self._create_batch_prompt(
                batch_content, batch_settings, batch_num, total_batches, 
                modules_per_batch, all_partials
            )
            
            start_time = time.time()
            response = self._generate_with_retry(prompt, max_retries=2, max_tokens=16384)
            batch_time = time.time() - start_time
            batch_times.append(batch_time)
            
            if not response or not response.text:
                print(f"❌ Batch {batch_num} failed")
                continue
            
            partial = self._parse_and_clean_course_response(response.text, batch_settings)
            all_partials.append(partial)
            
            # Save partial to DB if available
            if db_manager and content_id:
                partial_id = db_manager.save_partial_course(
                    {'course': partial['course']}, content_id, batch_num, total_batches
                )
                print(f"💾 Saved partial batch {batch_num}/{total_batches}: {partial_id}")
                partial_available = True
            
            print(f"✅ Batch {batch_num} completed in {batch_time:.2f}s")
        
        # Merge all partials
        if len(all_partials) == total_batches:
            merged = self._merge_all_partials(all_partials, settings)
            total_time = sum(batch_times)
            
            print(f"⏱️  Batched generation completed in {total_time:.2f}s")
            
            return {
                "success": True,
                "course_data": merged,
                "source": "gemini_smart_batched",
                "settings_used": settings,
                "generation_time": total_time,
                "batched": True,
                "batches": total_batches,
                "partial_available": partial_available,
                "batch_times": batch_times
            }
        else:
            return {
                "success": False,
                "error": f"Only {len(all_partials)}/{total_batches} batches completed",
                "partial_available": partial_available,
                "completed_batches": len(all_partials)
            }
    
    def _calculate_modules_per_batch(self, total_modules, total_batches):
        """Calculate balanced module distribution across batches"""
        base_modules = total_modules // total_batches
        remainder = total_modules % total_batches
        
        distribution = [base_modules] * total_batches
        
        # Distribute remainder modules
        for i in range(remainder):
            distribution[i] += 1
        
        return distribution
    
    def _get_content_segment(self, content, batch_num, total_batches, total_modules):
        """Get relevant content segment for each batch with improved overlap and balance"""
        content_length = len(content)
        
        if total_batches == 1:
            return content
        
        # For multiple batches, divide content logically with larger overlap
        segment_size = content_length // total_batches
        start_idx = (batch_num - 1) * segment_size
        end_idx = batch_num * segment_size if batch_num < total_batches else content_length
        
        segment = content[start_idx:end_idx]
        
        # Add larger overlap from previous (except first batch) for context
        if batch_num > 1 and start_idx > 1000:
            overlap = content[max(0, start_idx - 1000):start_idx]
            segment = f"CONTEXT FROM PREVIOUS BATCH (OVERLAP FOR CONTINUITY): {overlap}\n\nMAIN CONTENT FOR THIS BATCH:\n{segment}"
        elif batch_num == 1:
            # For first batch, emphasize full usage
            segment = f"THIS IS THE FIRST BATCH - USE ALL PROVIDED CONTENT FOR MODULES 1-{total_modules//total_batches}: {segment}"
        
        # Balance: If segment too short (<20% of total), add more from next
        if len(segment) < (content_length * 0.2) and batch_num < total_batches:
            extra = content[end_idx:min(end_idx + 500, content_length)]
            segment += f"\n\nADDITIONAL CONTEXT FOR COMPLETENESS: {extra}"
        
        print(f"📄 Batch {batch_num} content: {len(segment)} chars (overlap: {1000 if batch_num > 1 else 0})")
        return segment
    
    def _merge_all_partials(self, partials, settings):
        """Merge all partial courses into one complete course"""
        merged_course = {
            'title': '',
            'description': '',
            'total_modules': settings.get('modules', 4),
            'difficulty': settings.get('difficulty', 'beginner'),
            'learning_pace': settings.get('learning_pace', 'medium'),
            'depth_level': settings.get('depth_level', 'comprehensive'),
            'estimated_duration': '',
            'modules': [],
            'flashcards': [],
            'learning_outcomes': [],
            'prerequisites': [],
            'target_audience': '',
            'course_completion_bonus': {}
        }
        
        module_counter = 1
        
        for i, partial in enumerate(partials):
            course_data = partial['course']
            
            # Get metadata from first batch
            if i == 0:
                merged_course.update({
                    'title': course_data.get('title', 'Generated Course'),
                    'description': course_data.get('description', ''),
                    'learning_outcomes': course_data.get('learning_outcomes', []),
                    'prerequisites': course_data.get('prerequisites', []),
                    'target_audience': course_data.get('target_audience', ''),
                    'estimated_duration': course_data.get('estimated_duration', '')
                })
            
            # Add modules with corrected module numbers
            for module in course_data.get('modules', []):
                # Fix any camelCase to snake_case if present
                if 'moduleNumber' in module:
                    module['module_number'] = module.pop('moduleNumber')
                module['module_number'] = module_counter
                merged_course['modules'].append(module)
                module_counter += 1
            
            # Add flashcards from last batch
            if i == len(partials) - 1:
                merged_course['flashcards'] = course_data.get('flashcards', [])
                merged_course['course_completion_bonus'] = course_data.get('course_completion_bonus', {})
        
        # Ensure exact number of flashcards from settings
        flashcard_count = settings.get('flashcards', 15)
        if len(merged_course['flashcards']) < flashcard_count:
            # Add placeholders if needed
            for i in range(len(merged_course['flashcards']), flashcard_count):
                merged_course['flashcards'].append({
                    "id": i + 1,
                    "front": f"Key Term {i + 1}",
                    "back": "Definition of key term",
                    "mnemonic": "Memory aid for term",
                    "category": "Fundamentals",
                    "importance": "high - reason why important",
                    "visual_cue": "Visual memory aid",
                    "related_concepts": ["Related concept 1", "Related concept 2"],
                    "difficulty": "medium"
                })
        
        return {'course': merged_course}
    
    def _generate_with_retry(self, prompt, max_retries=2, max_tokens=16384):
        """Generate with retry and backoff"""
        for attempt in range(max_retries + 1):
            try:
                time.sleep(2 ** attempt)  # Exponential backoff
                return self.model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.7,
                        top_p=0.95,
                        top_k=40,
                        max_output_tokens=max_tokens,
                    )
                )
            except Exception as e:
                print(f"⚠️ Generation attempt {attempt + 1} failed: {e}")
                if attempt == max_retries:
                    return None
        return None
    
    def _create_optimized_prompt(self, content, settings, questions_per_module=3):
        """Create optimized prompt with FULL CONTENT UTILIZATION and CLEAN NOTES"""
        
        flashcards_count = settings.get('flashcards', 15)
        
        prompt_parts = [
            "🎯 **SMART COURSE GENERATION PROMPT** 🎯",
            "",
            "You are an expert course designer. Create a comprehensive learning course using ALL provided content.",
            "",
            "📊 **COURSE SETTINGS:**",
            f"• MODULES: {settings.get('modules', 4)}",
            f"• DIFFICULTY: {settings.get('difficulty', 'beginner')}",
            f"• DEPTH: {settings.get('depth_level', 'comprehensive')}",
            f"• FLASHCARDS: EXACTLY {flashcards_count} - Generate precisely this many with full details",
            f"• QUESTIONS PER MODULE: {questions_per_module}",
            "",
            "🚀 **KEY REQUIREMENTS:**",
            "1. USE ALL PROVIDED CONTENT - Don't skip any important information",
            "2. CLEAN FORMATTING - No unnecessary symbols like *, • in notes (use emojis for bullets)",
            "3. BALANCED MODULES - Distribute content evenly across all modules",
            "4. PRACTICAL FOCUS - Include real-world applications and examples",
            "5. CLEAR STRUCTURE - Well-organized with proper headings and sections",
            "6. PROPER QUIZ FORMAT - Each module must have quiz with proper options A), B), C), D)",
            "",
            "📝 **CONTENT DISTRIBUTION STRATEGY:**",
            f"- You have {len(content)} characters of content to distribute across {settings.get('modules', 4)} modules",
            "- Ensure each module covers distinct but connected topics",
            "- Maintain logical progression from basic to advanced concepts",
            "- Use ALL key concepts and information from the provided content",
            "",
            "🎨 **NOTE FORMATTING GUIDELINES:**",
            "- Use clean, professional formatting",
            "- **INTRODUCTION AND CONTENT SECTIONS: MUST BE IN EMOJI POINT-WISE FORMAT ONLY** - use emojis like 📍, 🔹, or numbered points like '1. Main point' for bullets",
            "- **IMPORTANT TERMS: Make them bold using **bold** format** - highlight key technical terms and concepts",
            "- NO hyphens (-) or traditional bullets (•) for points - use emojis: 📍 Main point, 🔹 Sub-point, 📋 List item",
            "- Use proper headings and subheadings",
            "- Clear, concise explanations",
            "- Real-world examples and applications",
            "",
            "❓ **QUIZ REQUIREMENTS:**",
            f"- Each module must have exactly {questions_per_module} quiz questions",
            "- Each question must have 4 options labeled A), B), C), D)",
            "- Options must be meaningful and distinct",
            "- Correct answer must be one of A, B, C, D",
            "- Include detailed explanations for each answer",
            "- Questions should test understanding of key concepts",
            "",
            "🃏 **FLASHCARD REQUIREMENTS:**",
            f"- Generate EXACTLY {flashcards_count} flashcards covering all key concepts from the entire course",
            "- Each flashcard must have: id, front (question/term), back (detailed answer), mnemonic (story/acronym), category, importance (high/medium/low with reason), visual_cue (image tip), related_concepts (emoji-point-wise list), difficulty",
            "- Distribute across topics evenly, no less than specified",
            "",
            "📋 **RESPONSE STRUCTURE (STRICT JSON):**",
            json.dumps({
                "course": {
                    "title": "Course Title",
                    "description": "Course description using all key concepts",
                    "total_modules": settings.get('modules', 4),
                    "difficulty": settings.get('difficulty', 'beginner'),
                    "learning_pace": settings.get('learning_pace', 'medium'),
                    "depth_level": settings.get('depth_level', 'comprehensive'),
                    "estimated_duration": "X-Y hours",
                    "learning_outcomes": ["Outcome 1", "Outcome 2"],
                    "prerequisites": ["Basic knowledge"],
                    "target_audience": "Target audience",
                    "modules": [
                        {
                            "module_number": 1,
                            "title": "Module Title",
                            "duration_estimate": "X hours",
                            "learning_objectives": ["Objective 1", "Objective 2"],
                            "key_concepts": ["Concept 1", "Concept 2"],
                            "content": {
                                "introduction": "EMOJI POINT-WISE INTRODUCTION ONLY: 📍 **Key Term 1**: Explanation with example\n🔹 **Key Term 2**: Detailed point-wise explanation\n📋 Main concept overview in points",
                                "sections": [
                                    {
                                        "heading": "Section Heading",
                                        "content": "EMOJI POINT-WISE CONTENT ONLY: 📍 **Important Term**: Detailed explanation with subpoints 1. Sub-detail A 2. Sub-detail B\n🔹 **Another Term**: Explanation with real examples\n📋 Practical applications in points",
                                        "notes_hierarchy": {
                                            "main_topic": "Main Topic",
                                            "subtopics": [
                                                {
                                                    "subtopic": "Subtopic Name",
                                                    "points": ["📍 **Key Concept**: Point-wise explanation with real example", "🔹 **Another Concept**: Application details"],
                                                    "sub_points": ["📋 Sub-detail 1", "📍 Sub-detail 2"],
                                                    "important_concepts": [
                                                        "📍 **Concept Name**: Point-wise explanation with real-world examples and applications"
                                                    ]
                                                }
                                            ],
                                            "key_takeaways": ["📍 **Takeaway 1** - key insight", "🔹 **Takeaway 2** - practical tip"]
                                        },
                                        "key_points": ["📍 **Key point 1**: Details", "🔹 **Key point 2**: More details"],
                                        "real_world_application": "Practical scenario with emoji points: 📍 Step 1: Description\n🔹 Step 2: Implementation",
                                        "common_mistakes": "📍 **Mistake 1**: Explanation\n🔹 **Mistake 2**: How to avoid",
                                        "best_practices": ["📍 **Practice 1**: Step-by-step", "🔹 **Practice 2**: Examples"]
                                    }
                                ],
                                "summary": "EMOJI POINT-WISE Module summary: 📍 **Main idea 1**\n🔹 **Main idea 2**"
                            },
                            "practical_exercises": [
                                {
                                    "title": "Exercise Title",
                                    "description": "EMOJI POINT-WISE Description: 📍 Step 1\n🔹 Step 2",
                                    "steps": ["1. Step 1 details", "2. Step 2 with example"],
                                    "expected_outcome": "Expected result with emoji points"
                                }
                            ],
                            "quiz": {
                                "questions": [
                                    {
                                        "id": 1,
                                        "question": "Clear question text about the module content?",
                                        "options": [
                                            "A) First plausible option",
                                            "B) Second plausible option", 
                                            "C) Third plausible option",
                                            "D) Fourth plausible option"
                                        ],
                                        "correct_answer": "A",
                                        "explanation": "EMOJI POINT-WISE explanation: 📍 Why A is correct 1. Reason 1 2. Reason 2",
                                        "difficulty": "easy/medium/hard",
                                        "knowledgeArea": "Specific topic area",
                                        "commonMistake": "📍 Common mistake with points: 1. Error 2. Fix",
                                        "points": 5
                                    }
                                ]
                            }
                        }
                    ],
                    "flashcards": [
                        # Generate exactly flashcards_count examples
                        {
                            "id": 1,
                            "front": "Question or term",
                            "back": "Clear answer without symbols - emoji point-wise if needed",
                            "mnemonic": "Memorization tip: e.g., acronym or story for easy recall",
                            "category": "Topic category",
                            "importance": "high - explain why",
                            "visual_cue": "Visual memory aid: imagine this image",
                            "related_concepts": ["📍 Related concept 1 with brief point", "🔹 Related concept 2"],
                            "difficulty": "easy/medium/hard"
                        }
                        # ... repeat pattern up to exactly flashcards_count
                    ],
                    "course_completion_bonus": {
                        "capstone_project": "EMOJI POINT-WISE Final project: 📍 Step 1\n🔹 Step 2",
                        "next_learning_steps": ["📍 Next topic 1", "🔹 Resource 2 with tips"]
                    }
                }
            }, indent=2),
            "",
            "🎯 **FINAL INSTRUCTIONS:**",
            "1. USE ALL PROVIDED CONTENT COMPREHENSIVELY",
            "2. **INTRODUCTION AND CONTENT MUST BE EMOJI POINT-WISE ONLY** - use 📍, 🔹, 📋 for structure, no hyphens or paragraphs",
            "3. **IMPORTANT TERMS IN BOLD** - highlight key concepts using **bold**",
            "4. CLEAN TEXT ONLY - no symbols in notes, but use emoji points like '📍 Point:' everywhere",
            "5. BALANCE CONTENT ACROSS MODULES - emoji point-wise distribution", 
            "6. PRACTICAL, REAL-WORLD FOCUS - examples in emoji points",
            f"7. {questions_per_module} QUIZ QUESTIONS PER MODULE WITH PROPER OPTIONS",
            f"8. EXACTLY {flashcards_count} FLASHCARDS - with mnemonic, importance, visual_cue, emoji-point related_concepts; full details for each",
            "9. VALID JSON RESPONSE ONLY",
            "",
            "📖 **CONTENT TO TRANSFORM (USE ALL OF THIS):**",
            f"{content}",
            "",
            "🚨 **REMEMBER: Emoji point-wise introduction and content (use 📍, 🔹 for structure), important terms in **bold**, full {flashcards_count} flashcards with mnemonic, importance, visual_cue, related_concepts; clean formatting, proper quiz options, use all content!**"
        ]
        
        return "\n".join(prompt_parts)
    
    def _create_batch_prompt(self, content, settings, batch_num, total_batches, modules_per_batch, previous_partials):
        """Create batch-specific prompt with continuity and quality focus"""
        
        flashcards_count = settings.get('flashcards', 15)
        
        continuity_context = ""
        if previous_partials:
            # IMPROVED: More context - titles, objectives, and summaries from prev (up to 3000 chars)
            prev_summary = ""
            for partial in previous_partials[-2:]:  # Last 2 for recent context
                mod_summ = partial['course'].get('modules', [])
                prev_summary += f"Previous batch modules: {[m.get('title', 'Untitled') for m in mod_summ]} | Objectives: {partial['course'].get('learning_objectives', [])} | Key summary: {partial['course'].get('description', '')[:500]}\n"
            continuity_context = f"CONTINUITY CONTEXT - BUILD ON THIS: {prev_summary[:3000]}"  # Increased to 3000
        
        # Quality Guidelines (copied from single prompt for better notes)
        quality_guidelines = [
            "🚀 **KEY REQUIREMENTS FOR THIS BATCH:**",
            f"1. USE ALL PROVIDED CONTENT SEGMENT - Distribute EVERY key concept from this batch's text across the {settings['modules']} modules",
            "2. **EMOJI POINT-WISE INTRODUCTION AND CONTENT**: All introductions and content sections MUST be in emoji point-wise format using 📍, 🔹, 📋",
            "3. **BOLD IMPORTANT TERMS**: Highlight key technical terms and concepts using **bold** format",
            "4. CLEAN FORMATTING: No hyphens (-), bullets (•), or traditional symbols - use emoji bullets 📍, 🔹 for all points",
            "5. PRACTICAL: Include applications, examples, common mistakes, best practices in emoji point-wise lists",
            "6. LOGICAL FLOW: Modules in this batch should connect to previous (if any) and lead to next",
            f"7. QUIZ: Exactly {settings.get('questions_per_module', 3)} questions per module with A/B/C/D options, explanations",
            f"8. FLASHCARDS (LAST BATCH ONLY): Generate EXACTLY {flashcards_count} with full fields: mnemonic (memorization tip), importance (high/medium/low with reason), visual_cue (image tip), related_concepts (emoji point-wise)",
            "",
            "📝 **CONTENT FOR THIS BATCH (USE ALL OF IT FOR MODULES {sum(modules_per_batch[:batch_num-1]) + 1} to {sum(modules_per_batch[:batch_num])}):**"
        ]
        
        # Full JSON structure example (enhanced like single prompt)
        batch_json_example = json.dumps({
            "course": {
                # For batch 1: Include metadata
                "title": "Course Title" if batch_num == 1 else "N/A (from batch 1)",
                "description": "Full description" if batch_num == 1 else "N/A",
                # ... other metadata only for batch 1
                "modules": [  # Exactly modules_per_batch[batch_num-1] modules
                    {
                        "module_number": sum(modules_per_batch[:batch_num-1]) + 1,  # Sequential
                        "title": f"Module {sum(modules_per_batch[:batch_num-1]) + 1}: Detailed Title from content",
                        "duration_estimate": "45-60 minutes",
                        "learning_objectives": ["Objective from this segment", "Another from content"],
                        "content": {
                            "introduction": "EMOJI POINT-WISE INTRODUCTION ONLY: 📍 **Key Term 1**: Explanation with example\n🔹 **Key Term 2**: Detailed point-wise explanation\n📋 Main concept overview in points",
                            "sections": [  # 3-5 sections per module, detailed
                                {
                                    "heading": "Section from content",
                                    "content": "EMOJI POINT-WISE CONTENT ONLY: 📍 **Important Term**: Detailed explanation with subpoints 1. Sub-detail A 2. Sub-detail B\n🔹 **Another Term**: Explanation with real examples\n📋 Practical applications in points",
                                    "notes_hierarchy": {
                                        "main_topic": "Key topic",
                                        "subtopics": [{"subtopic": "Sub", "points": ["📍 **Key Concept**: Detailed point with real example"], "important_concepts": ["📍 **Concept**: Point-wise full explanation"]}],
                                        "key_takeaways": ["📍 **Takeaway 1**", "🔹 **Takeaway 2**"]
                                    },
                                    "key_points": ["📍 **Bullet-free point 1**", "🔹 **More details point 2**"],
                                    "real_world_application": "Practical example emoji point-wise: 📍 Step 1: Description\n🔹 Step 2: Implementation",
                                    "common_mistakes": "📍 **Mistake 1** point\n🔹 **Mistake 2** explanation",
                                    "best_practices": ["📍 **Practice 1**", "🔹 **Practice 2**"]
                                }
                            ],
                            "summary": "EMOJI POINT-WISE summary: 📍 **Main point 1**\n🔹 **Main point 2**"
                        },
                        "quiz": {
                            "questions": [  # Exactly questions_per_module
                                {
                                    "id": 1,
                                    "question": "Question based on this module's content?",
                                    "options": ["A) Correct from segment", "B) Wrong", "C) Wrong", "D) Wrong"],
                                    "correct_answer": "A",
                                    "explanation": "EMOJI POINT-WISE why A is correct: 📍 Reason 1\n🔹 Reason 2 referencing content",
                                    "difficulty": "medium",
                                    "knowledgeArea": "From module",
                                    "commonMistake": "📍 Common error point-wise",
                                    "points": 5
                                }
                                # ... more
                            ]
                        }
                    }
                    # ... more modules
                ],
                # Flashcards only in last batch - exactly flashcards_count
                "flashcards": [] if batch_num != total_batches else [
                    # Example pattern - repeat for exactly flashcards_count
                    {
                        "id": 1,
                        "front": "Term",
                        "back": "Detailed back emoji point-wise if needed",
                        "mnemonic": "Memorization tip: e.g., story or acronym",
                        "category": "Category",
                        "importance": "high - reason why important",
                        "visual_cue": "Visual tip: picture this image",
                        "related_concepts": ["📍 Related 1 with brief", "🔹 Related 2"],
                        "difficulty": "medium"
                    }
                    # ... generate exactly flashcards_count in total for last batch
                ],
                "course_completion_bonus": {} if batch_num != total_batches else {"capstone": "Project emoji point-wise"}
            }
        }, indent=2)
        
        prompt_parts = [
            f"🔄 **BATCH {batch_num}/{total_batches} - HIGH-QUALITY COURSE GENERATION**",
            "",
            f"Generating {settings['modules']} DETAILED modules for this batch using ONLY the provided content segment.",
            f"Total course: {sum(modules_per_batch)} modules across {total_batches} batches.",
            "",
            "📋 **BATCH SPECIFICS:**",
            f"• This batch covers Modules {sum(modules_per_batch[:batch_num-1]) + 1} to {sum(modules_per_batch[:batch_num])}",
            f"• Use segment content comprehensively - balance topics across modules",
            f"• Metadata (title, description, outcomes): Include ONLY if batch_num==1",
            f"• Flashcards & Bonus: Include ONLY if batch_num=={total_batches} - EXACTLY {flashcards_count} flashcards with full fields: mnemonic, importance, visual_cue, emoji-point related_concepts",
            "",
            "🎯 **CONTINUITY & QUALITY:**",
            "1. Base modules on THIS BATCH'S CONTENT SEGMENT - cover all key ideas emoji point-wise with subpoints (use 📍, 🔹, 📋)",
            "2. **EMOJI POINT-WISE INTRODUCTION AND CONTENT ONLY** - no paragraphs, no hyphens, all in structured emoji points",
            "3. **BOLD IMPORTANT TERMS** - highlight key concepts using **bold** format",
            "4. Connect to previous: {continuity_context}",
            "",
            "🚫 **SYMBOL-FREE FORMATTING:**",
            "- No hyphens (-), bullets (•), or emojis in content except for bullet points (use 📍, 🔹, 📋)",
            "- Clean, professional text only - all notes, content, keys, mistakes in EMOJI POINT-WISE format",
            "- Proper headings and structure",
            "",
            "❓ **QUIZ REQUIREMENTS:**",
            f"- Each module must have {settings.get('questions_per_module', 3)} quiz questions",
            "- Questions must have proper A), B), C), D) options",
            "- Options must be meaningful and test understanding",
            f"🃏 **LAST BATCH FLASHCARDS:** Exactly {flashcards_count} - cover all course topics, full details for each one",
            "",
            "📋 **USE THIS PARTIAL JSON STRUCTURE (focus on modules for this batch): **",
            batch_json_example,
            '\n'.join(quality_guidelines),
            f"{content}",
            "",
            "Focus on quality content without decorative symbols! Generate VALID JSON ONLY with emoji point-wise notes and EXACTLY {flashcards_count} flashcards details.",
            ""
        ]
        
        return "\n".join(prompt_parts)
    
    def _parse_and_clean_course_response(self, response_text, settings):
        """Parse response and clean unwanted symbols"""
        try:
            # Clean JSON response
            cleaned_text = self._clean_json_response(response_text)
            
            # Parse JSON
            course_data = json.loads(cleaned_text)
            
            # Clean unwanted symbols from the course data
            course_data = self._clean_course_symbols(course_data)
            
            # Validate and fix quiz structure
            course_data = self._validate_and_fix_quiz_structure(course_data, settings)
            
            # Validate overall structure
            return self._validate_course_structure(course_data, settings)
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing error: {e}")
            # Advanced cleaning attempt
            advanced_cleaned = self._advanced_json_cleaning(response_text)
            try:
                course_data = json.loads(advanced_cleaned)
                course_data = self._clean_course_symbols(course_data)
                course_data = self._validate_and_fix_quiz_structure(course_data, settings)
                return self._validate_course_structure(course_data, settings)
            except:
                print(f"❌ Advanced cleaning failed, using fallback")
                return self._create_fallback_course(settings)
    
    def _validate_and_fix_quiz_structure(self, course_data, settings):
        """Validate and fix quiz question structure"""
        if 'course' not in course_data:
            return course_data
        
        course = course_data['course']
        questions_per_module = settings.get('questions_per_module', 3)
        
        for module in course.get('modules', []):
            # Fix module number if camelCase
            if 'moduleNumber' in module:
                module['module_number'] = module.pop('moduleNumber')
            
            if 'quiz' not in module:
                module['quiz'] = {'questions': []}
            
            quiz = module['quiz']
            if 'questions' not in quiz:
                quiz['questions'] = []
            
            # Ensure we have the right number of questions
            current_questions = quiz['questions']
            
            # Fix each question structure
            for i, question in enumerate(current_questions):
                # Ensure question has ID
                if 'id' not in question:
                    question['id'] = i + 1
                
                # Ensure options are properly formatted
                if 'options' in question:
                    # Fix option formatting
                    fixed_options = []
                    for j, option in enumerate(question['options']):
                        if isinstance(option, str):
                            # Ensure option has proper A), B), C), D) format
                            option_letter = ['A', 'B', 'C', 'D'][j] if j < 4 else str(j+1)
                            if not re.match(r'^[A-D]\)', option.strip()):
                                fixed_options.append(f"{option_letter}) {option.strip()}")
                            else:
                                fixed_options.append(option.strip())
                        else:
                            option_letter = ['A', 'B', 'C', 'D'][j] if j < 4 else str(j+1)
                            fixed_options.append(f"{option_letter}) {str(option)}")
                    
                    # Ensure we have exactly 4 options
                    while len(fixed_options) < 4:
                        option_letter = ['A', 'B', 'C', 'D'][len(fixed_options)]
                        fixed_options.append(f"{option_letter}) Option not available")
                    
                    question['options'] = fixed_options[:4]  # Keep only first 4
                
                # Ensure correct_answer is valid
                if 'correct_answer' not in question or question['correct_answer'] not in ['A', 'B', 'C', 'D']:
                    question['correct_answer'] = 'A'  # Default to first option
                
                # Ensure explanation exists
                if 'explanation' not in question or not question['explanation']:
                    question['explanation'] = "Explanation not available"
                
                # Ensure difficulty exists
                if 'difficulty' not in question:
                    question['difficulty'] = 'medium'
                
                # Ensure knowledgeArea exists
                if 'knowledgeArea' not in question:
                    question['knowledgeArea'] = module.get('title', 'General Knowledge')
                
                # Ensure commonMistake exists
                if 'commonMistake' not in question:
                    question['commonMistake'] = 'No common mistake information available'
                
                # Ensure points exist
                if 'points' not in question:
                    question['points'] = 5
            
            # If we don't have enough questions, add placeholder questions
            while len(current_questions) < questions_per_module:
                new_question = {
                    'id': len(current_questions) + 1,
                    'question': f'Question about {module.get("title", "this module")}?',
                    'options': [
                        'A) First option',
                        'B) Second option',
                        'C) Third option',
                        'D) Fourth option'
                    ],
                    'correct_answer': 'A',
                    'explanation': 'This is a placeholder question. Real questions were not provided.',
                    'difficulty': 'medium',
                    'knowledgeArea': module.get('title', 'General Knowledge'),
                    'commonMistake': 'No common mistake information available',
                    'points': 5
                }
                current_questions.append(new_question)
        
        return course_data
    
    def _clean_course_symbols(self, course_data):
        """Remove unwanted symbols from course content"""
        if 'course' not in course_data:
            return course_data
        
        course = course_data['course']
        
        # Clean title and description
        for field in ['title', 'description', 'target_audience']:
            if field in course and course[field]:
                course[field] = self._remove_symbols(course[field])
        
        # Clean modules
        for module in course.get('modules', []):
            # Clean module fields
            for field in ['title', 'description']:
                if field in module and module[field]:
                    module[field] = self._remove_symbols(module[field])
            
            # Clean content
            if 'content' in module:
                content = module['content']
                for field in ['introduction', 'summary']:
                    if field in content and content[field]:
                        content[field] = self._remove_symbols(content[field])
                
                # Clean sections
                for section in content.get('sections', []):
                    # Fix camelCase if present
                    if 'heading' not in section and 'Heading' in section:
                        section['heading'] = section.pop('Heading', '')
                    
                    for section_field in ['heading', 'content', 'real_world_application', 'common_mistakes']:
                        if section_field in section and section[section_field]:
                            section[section_field] = self._remove_symbols(section[section_field])
                    
                    # Clean notes hierarchy
                    if 'notes_hierarchy' in section:
                        hierarchy = section['notes_hierarchy']
                        if 'main_topic' in hierarchy:
                            hierarchy['main_topic'] = self._remove_symbols(hierarchy['main_topic'])
                        
                        for subtopic in hierarchy.get('subtopics', []):
                            if 'subtopic' in subtopic:
                                subtopic['subtopic'] = self._remove_symbols(subtopic['subtopic'])
                            
                            # Clean points and sub_points
                            for i in range(len(subtopic.get('points', []))):
                                subtopic['points'][i] = self._remove_symbols(subtopic['points'][i])
                            for i in range(len(subtopic.get('sub_points', []))):
                                subtopic['sub_points'][i] = self._remove_symbols(subtopic['sub_points'][i])
                            for i in range(len(subtopic.get('important_concepts', []))):
                                subtopic['important_concepts'][i] = self._remove_symbols(subtopic['important_concepts'][i])
                        
                        # Clean key takeaways
                        for i in range(len(hierarchy.get('key_takeaways', []))):
                            hierarchy['key_takeaways'][i] = self._remove_symbols(hierarchy['key_takeaways'][i])
            
            # Clean practical exercises
            for exercise in module.get('practical_exercises', []):
                for field in ['title', 'description', 'expected_outcome']:
                    if field in exercise and exercise[field]:
                        exercise[field] = self._remove_symbols(exercise[field])
                for i in range(len(exercise.get('steps', []))):
                    exercise['steps'][i] = self._remove_symbols(exercise['steps'][i])
            
            # Clean quiz questions (but preserve option formatting)
            if 'quiz' in module and 'questions' in module['quiz']:
                for question in module['quiz']['questions']:
                    # Clean question text but preserve option formatting
                    if 'question' in question:
                        question['question'] = self._remove_symbols(question['question'])
                    if 'explanation' in question:
                        question['explanation'] = self._remove_symbols(question['explanation'])
                    if 'commonMistake' in question:
                        question['commonMistake'] = self._remove_symbols(question['commonMistake'])
        
        # Clean flashcards
        for flashcard in course.get('flashcards', []):
            for field in ['front', 'back', 'mnemonic', 'category', 'visual_cue']:
                if field in flashcard and flashcard[field]:
                    flashcard[field] = self._remove_symbols(flashcard[field])
            
            # Clean related_concepts array
            if 'related_concepts' in flashcard:
                for i in range(len(flashcard['related_concepts'])):
                    flashcard['related_concepts'][i] = self._remove_symbols(flashcard['related_concepts'][i])
        
        return course_data
    
    def _remove_symbols(self, text):
        """Remove unwanted symbols from text but preserve option formatting"""
        if not isinstance(text, str):
            return text
        
        # Remove specific unwanted symbols but keep essential punctuation and option letters
        symbols_to_remove = ['*', '•', '⭐', '🎯', '🚀', '📚', '🔄', '💡', '🎨', '📋']
        
        cleaned = text
        for symbol in symbols_to_remove:
            cleaned = cleaned.replace(symbol, '')
        
        # Clean up extra spaces but preserve option formatting
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        return cleaned
    
    def _clean_json_response(self, text):
        """Enhanced JSON response cleaning"""
        # Remove markdown code blocks
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)
        
        # Remove any text before first { and after last }
        start = text.find('{')
        end = text.rfind('}') + 1
        
        if start != -1 and end != 0:
            text = text[start:end]
        
        # Remove common AI response artifacts
        text = re.sub(r'^(Sure|Okay|Here).*?{', '{', text, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r'}\s*[^{]*$', '}', text)
        
        return text.strip()
    
    def _advanced_json_cleaning(self, text):
        """Advanced JSON cleaning for problematic responses"""
        json_pattern = r'\{.*\}'
        matches = re.findall(json_pattern, text, re.DOTALL)
        
        if matches:
            return max(matches, key=len)
        
        return self._construct_json_from_text(text)
    
    def _construct_json_from_text(self, text):
        """Construct JSON from text analysis as last resort"""
        print("🛠️  Constructing JSON from text analysis...")
        return self._create_fallback_course({
            "difficulty": "intermediate",
            "learning_pace": "medium", 
            "depth_level": "comprehensive"
        })
    
    def _validate_course_structure(self, course_data, settings):
        """Validate course structure with clean defaults"""
        if 'course' not in course_data:
            course_data = {'course': course_data}
        
        course = course_data['course']
        
        # Ensure modules is always a list (fix for undefined.length)
        if 'modules' not in course:
            course['modules'] = []
        
        # Ensure flashcards
        flashcards_count = settings.get('flashcards', 15)
        if 'flashcards' not in course:
            course['flashcards'] = []
        if len(course['flashcards']) < flashcards_count:
            for i in range(len(course['flashcards']), flashcards_count):
                course['flashcards'].append({
                    "id": i + 1,
                    "front": f"Key Term {i + 1}",
                    "back": "Definition of key term",
                    "mnemonic": "Memory aid for term",
                    "category": "Fundamentals",
                    "importance": "high - reason why important",
                    "visual_cue": "Visual memory aid: imagine this image",
                    "related_concepts": ["📍 Related concept 1 with brief point", "🔹 Related concept 2"],
                    "difficulty": "medium"
                })
        
        # Set defaults
        defaults = {
            'title': 'Comprehensive Learning Course',
            'description': 'A detailed course covering essential concepts and practical applications',
            'total_modules': settings.get('modules', 4),
            'difficulty': settings.get('difficulty', 'beginner'),
            'learning_pace': settings.get('learning_pace', 'medium'),
            'depth_level': settings.get('depth_level', 'comprehensive'),
            'estimated_duration': f"{settings.get('modules', 4) * 45} minutes",
            'learning_outcomes': [
                "Understand core concepts and principles",
                "Apply knowledge in practical scenarios",
                "Develop problem-solving skills",
                "Gain industry-relevant insights"
            ],
            'prerequisites': ['Basic understanding of the subject area'],
            'target_audience': 'Students, professionals, and lifelong learners'
        }
        
        for field, default in defaults.items():
            if field not in course or not course[field]:
                course[field] = default
        
        # Ensure modules have proper structure
        for i, module in enumerate(course.get('modules', [])):
            # Override/fix module_number
            module['module_number'] = i + 1
            
            if 'title' not in module:
                module['title'] = f'Module {i + 1}: Key Concepts'
            
            if 'content' not in module:
                module['content'] = {
                    'introduction': 'EMOJI POINT-WISE INTRODUCTION: 📍 **Key Concept 1**: Explanation\n🔹 **Key Concept 2**: Details\n📋 Overview of module topics',
                    'sections': [],
                    'summary': 'EMOJI POINT-WISE SUMMARY: 📍 **Main learning 1**\n🔹 **Main learning 2**'
                }
            # Ensure quiz is there
            if 'quiz' not in module:
                module['quiz'] = {'questions': []}
        
        return course_data
    
    def _create_fallback_course(self, settings):
        """Create clean fallback course structure with proper quizzes"""
        modules = []
        questions_per_module = settings.get('questions_per_module', 3)
        flashcards_count = settings.get('flashcards', 15)
        
        for i in range(settings.get('modules', 4)):
            # Create quiz questions for each module
            quiz_questions = []
            for q in range(questions_per_module):
                quiz_questions.append({
                    'id': q + 1,
                    'question': f'What is the key concept from Module {i+1}?',
                    'options': [
                        'A) First important concept',
                        'B) Second important concept',
                        'C) Third important concept', 
                        'D) Fourth important concept'
                    ],
                    'correct_answer': 'A',
                    'explanation': '📍 This is the most fundamental concept for this module. 🔹 Reason 1. 📋 Reason 2.',
                    'difficulty': 'medium',
                    'knowledgeArea': f'Module {i+1} Concepts',
                    'commonMistake': '📍 Confusing this with other similar concepts. 🔹 How to avoid: Focus on key differences.',
                    'points': 5
                })
            
            modules.append({
                'module_number': i + 1,
                'title': f'Module {i+1}: Core Concepts',
                'duration_estimate': '45 minutes',
                'learning_objectives': [
                    f'Understand key concepts for module {i+1}',
                    f'Apply knowledge from module {i+1}'
                ],
                'content': {
                    'introduction': f'EMOJI POINT-WISE INTRODUCTION: 📍 **Key Concept 1**: Explanation\n🔹 **Key Concept 2**: Details\n📋 Overview of module topics',
                    'sections': [
                        {
                            'heading': 'Main Concepts',
                            'content': 'EMOJI POINT-WISE CONTENT: 📍 **Important Term**: Detailed explanation\n🔹 **Another Term**: Application examples',
                            'key_points': ['📍 **Key point 1**', '🔹 **Key point 2**'],
                            'real_world_application': '📍 Practical application of these concepts'
                        }
                    ],
                    'summary': f'EMOJI POINT-WISE SUMMARY: 📍 **Main learning 1**\n🔹 **Main learning 2**'
                },
                'quiz': {
                    'questions': quiz_questions
                }
            })
        
        # Generate exactly flashcards_count flashcards
        flashcards = []
        for i in range(flashcards_count):
            flashcards.append({
                "id": i + 1,
                "front": f"Key Term {i + 1}",
                "back": f"📍 Definition of key term {i + 1}. 🔹 Detailed explanation.",
                "mnemonic": f"Memory aid for term {i + 1}: Use acronym or story",
                "category": "Fundamentals",
                "importance": "high - crucial for understanding core concepts",
                "visual_cue": f"Visual memory aid for term {i + 1}: imagine a related image",
                "related_concepts": ["📍 Related concept 1 with brief point", "🔹 Related concept 2"],
                "difficulty": "medium"
            })
        
        return {
            "course": {
                "title": "Comprehensive Learning Course",
                "description": "A well-structured course covering essential concepts with practical applications",
                "total_modules": settings.get('modules', 4),
                "difficulty": settings.get('difficulty', 'beginner'),
                "learning_pace": settings.get('learning_pace', 'medium'),
                "depth_level": settings.get('depth_level', 'comprehensive'),
                "estimated_duration": "2-3 hours",
                "learning_outcomes": [
                    "Master fundamental concepts",
                    "Apply knowledge practically",
                    "Develop critical thinking skills"
                ],
                "prerequisites": ["Basic knowledge of the subject"],
                "target_audience": "All learners seeking comprehensive understanding",
                "modules": modules,
                "flashcards": flashcards,  # Exactly the requested number
                "course_completion_bonus": {
                    "capstone_project": "📍 Practical application project. 🔹 Step-by-step guide.",
                    "next_learning_steps": "📍 Advanced topics and resources. 🔹 Further reading tips."
                }
            }
        }

# Test function
def test_smart_generation():
    """Test the improved course generation with quiz focus"""
    try:
        print("🧪 Testing SMART course generation with quizzes...")
        generator = GeminiCourseGenerator()
        
        if not generator.model:
            print("❌ Gemini not initialized")
            return
        
        # Test content
        test_content = """
        Data communications involves transmitting digital data between two or more devices. 
        Networks enable communication and resource sharing. Key concepts include protocols, 
        bandwidth, latency, and network topologies. The OSI model provides a framework for 
        understanding network communications across seven layers.
        
        Networking fundamentals cover LAN, WAN, routers, switches, and firewalls. 
        Security aspects include encryption, authentication, and access control.
        Modern networks use TCP/IP protocols for internet communication.
        """
        
        # Test with quiz settings (5 modules for single batch test)
        settings = {
            "difficulty": "intermediate",
            "learning_pace": "medium", 
            "depth_level": "comprehensive",
            "modules": 5,  # Tests single batch
            "flashcards": 20,  # Test with 20 flashcards
            "questions_per_module": 4,  # Test with 4 questions per module
            "include_practical": True,
            "include_case_studies": True
        }
        
        result = generator.generate_course(test_content, settings)
        
        if result['success']:
            course = result['course_data']['course']
            print(f"✅ Success: {len(course['modules'])} modules generated")
            
            # Check quiz questions in each module
            for i, module in enumerate(course['modules']):
                quiz_questions = module.get('quiz', {}).get('questions', [])
                print(f"   Module {i+1}: {len(quiz_questions)} quiz questions")
                
                # Check first question structure
                if quiz_questions:
                    first_question = quiz_questions[0]
                    print(f"   Sample question: {first_question['question'][:50]}...")
                    print(f"   Options: {len(first_question['options'])} options")
                    print(f"   Correct answer: {first_question['correct_answer']}")
            
            # Check flashcards
            flashcards = course.get('flashcards', [])
            print(f"🃏 Flashcards generated: {len(flashcards)} (requested: {settings['flashcards']})")
        else:
            print(f"❌ Failed: {result['error']}")
            
    except Exception as e:
        print(f"❌ Test error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    test_smart_generation()